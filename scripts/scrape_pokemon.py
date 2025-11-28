import asyncio
import aiohttp
import json
import os
import time

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'all-pokemon.json')

# Cache for evolution chain data: species_name -> evolution_depth
evolution_depth_cache = {}
# Cache for evolution family: species_name -> list of all species IDs in the family
evolution_family_cache = {}

async def fetch_url(session, url):
    try:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.json()
            else:
                print(f"Error fetching {url}: {response.status}")
                return None
    except Exception as e:
        print(f"Exception fetching {url}: {e}")
        return None

async def fetch_all_evolution_chains(session):
    """Fetch all evolution chains and build a mapping of species name to evolution stage."""
    print("Fetching evolution chains...")
    
    # Get total count of evolution chains
    url = "https://pokeapi.co/api/v2/evolution-chain/?limit=1"
    data = await fetch_url(session, url)
    if not data:
        return
    
    total_chains = data['count']
    print(f"Found {total_chains} evolution chains to process.")
    
    # Fetch all chain URLs
    url = f"https://pokeapi.co/api/v2/evolution-chain/?limit={total_chains}"
    data = await fetch_url(session, url)
    if not data:
        return
    
    chain_urls = [item['url'] for item in data['results']]
    
    # Process chains in chunks
    chunk_size = 50
    for i in range(0, len(chain_urls), chunk_size):
        chunk = chain_urls[i:i+chunk_size]
        print(f"Processing evolution chains {i} to {i+len(chunk)}...")
        tasks = [fetch_url(session, url) for url in chunk]
        results = await asyncio.gather(*tasks)
        
        for chain_data in results:
            if chain_data:
                process_evolution_chain(chain_data['chain'], 1)
        
        await asyncio.sleep(0.3)
    
    print(f"Cached evolution data for {len(evolution_depth_cache)} species.")

def get_max_chain_depth(chain):
    """Recursively find the maximum depth of an evolution chain."""
    if not chain.get('evolves_to') or len(chain['evolves_to']) == 0:
        return 1
    
    max_depth = 0
    for evolution in chain['evolves_to']:
        depth = get_max_chain_depth(evolution)
        max_depth = max(max_depth, depth)
    
    return 1 + max_depth

def process_evolution_chain(chain, current_stage, max_stage=None, family_ids=None):
    """Process an evolution chain and cache species with their evolution depth and family.
    
    The evolution depth represents how many total stages exist in this Pokemon's
    evolution line. The evolution family is a list of all Pokemon IDs in the line.
    For example: Bulbasaur has depth 3 and family [1, 2, 3].
    """
    # First pass: calculate max depth and collect all family IDs
    if max_stage is None:
        max_stage = get_max_chain_depth(chain)
        family_ids = collect_family_ids(chain)
    
    species_name = chain['species']['name']
    evolution_depth_cache[species_name] = max_stage
    evolution_family_cache[species_name] = family_ids
    
    for evolution in chain.get('evolves_to', []):
        process_evolution_chain(evolution, current_stage + 1, max_stage, family_ids)

def collect_family_ids(chain):
    """Recursively collect all species IDs in an evolution chain."""
    # Extract ID from species URL (e.g., ".../pokemon-species/1/" -> 1)
    species_url = chain['species']['url']
    species_id = int(species_url.rstrip('/').split('/')[-1])
    
    ids = [species_id]
    for evolution in chain.get('evolves_to', []):
        ids.extend(collect_family_ids(evolution))
    
    return sorted(ids)

async def fetch_url(session, url):
    try:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.json()
            else:
                print(f"Error fetching {url}: {response.status}")
                return None
    except Exception as e:
        print(f"Exception fetching {url}: {e}")
        return None

async def get_generations(session):
    print("Fetching generations...")
    url = "https://pokeapi.co/api/v2/generation/"
    data = await fetch_url(session, url)
    generations = []
    if data:
        generations.extend(data['results'])
        while data['next']:
            data = await fetch_url(session, data['next'])
            if data:
                generations.extend(data['results'])
    return generations

async def get_species_from_gen(session, gen_url, gen_id):
    data = await fetch_url(session, gen_url)
    species_list = []
    region_name = "Unknown"
    if data:
        region_name = data.get('main_region', {}).get('name', 'Unknown').capitalize()
        for s in data['pokemon_species']:
            s['gen_id'] = gen_id
            species_list.append(s)
    return species_list, region_name

async def process_species(session, species_entry):
    url = species_entry['url']
    gen_id = species_entry['gen_id']
    
    species_data = await fetch_url(session, url)
    if not species_data:
        return None

    # Get English flavor text
    description = ""
    for entry in species_data.get('flavor_text_entries', []):
        if entry['language']['name'] == 'en':
            description = entry['flavor_text'].replace('\n', ' ').replace('\f', ' ')
            break
    
    # Get egg groups
    egg_group_renames = {
        'Water1': 'Water 1',
        'Water2': 'Water 2',
        'Water3': 'Water 3',
        'No-eggs': 'No Eggs',
        'Ground': 'Field',
        'Humanshape': 'Human-Like',
        'Plant': 'Grass'
    }
    egg_groups = []
    for eg in species_data.get('egg_groups', []):
        name = eg['name'].capitalize()
        egg_groups.append(egg_group_renames.get(name, name))
    
    # Get capture rate
    capture_rate = species_data.get('capture_rate', 0)
            
    # Get default variety
    default_variety = next((v for v in species_data['varieties'] if v['is_default']), species_data['varieties'][0])
    pokemon_url = default_variety['pokemon']['url']
    
    pokemon_data = await fetch_url(session, pokemon_url)
    if not pokemon_data:
        return None

    # Stats
    stats = {}
    stat_map = {
        'hp': 'hp',
        'attack': 'atk',
        'defense': 'def',
        'special-attack': 'spa',
        'special-defense': 'spd',
        'speed': 'spe'
    }
    bst = 0
    for s in pokemon_data['stats']:
        s_name = s['stat']['name']
        if s_name in stat_map:
            val = s['base_stat']
            stats[stat_map[s_name]] = val
            bst += val

    # Types
    types = [t['type']['name'].capitalize() for t in pokemon_data['types']]

    # Pseudo detection (Heuristic: BST >= 600, Not Legendary/Mythical, usually 3 stage but we skip that check)
    # Exclude Slaking (670) if we want, but for now simple heuristic
    is_legendary = species_data['is_legendary']
    is_mythical = species_data['is_mythical']
    is_pseudo = (bst >= 600) and (not is_legendary) and (not is_mythical) and (pokemon_data['name'] != 'slaking')
    
    # Evolution depth and family (from cached data)
    evolution_depth = evolution_depth_cache.get(species_data['name'], 1)
    evolution_family = evolution_family_cache.get(species_data['name'], [species_data['id']])

    # Download Sprite (only if missing)
    sprite_url = pokemon_data['sprites']['front_default']
    sprite_path = None
    if sprite_url:
        try:
            sprite_filename = f"{species_data['id']}.png"
            sprite_full_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'sprites', sprite_filename)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(sprite_full_path), exist_ok=True)

            # Only download if file doesn't exist
            if not os.path.exists(sprite_full_path):
                async with session.get(sprite_url) as resp:
                    if resp.status == 200:
                        with open(sprite_full_path, 'wb') as f:
                            f.write(await resp.read())
            
            sprite_path = f"data/sprites/{sprite_filename}"
        except Exception as e:
            print(f"Error downloading sprite for {species_data['name']}: {e}")

    # Download Official Artwork (only if missing)
    artwork_url = pokemon_data['sprites'].get('other', {}).get('official-artwork', {}).get('front_default')
    artwork_path = None
    if artwork_url:
        try:
            artwork_filename = f"{species_data['id']}.png"
            artwork_full_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'artwork', artwork_filename)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(artwork_full_path), exist_ok=True)

            # Only download if file doesn't exist
            if not os.path.exists(artwork_full_path):
                async with session.get(artwork_url) as resp:
                    if resp.status == 200:
                        with open(artwork_full_path, 'wb') as f:
                            f.write(await resp.read())
            
            artwork_path = f"data/artwork/{artwork_filename}"
        except Exception as e:
            print(f"Error downloading artwork for {species_data['name']}: {e}")

    return {
        "id": species_data['id'],
        "name": species_data['name'].capitalize(),
        "types": types,
        "eggGroups": egg_groups,
        "captureRate": capture_rate,
        "stats": stats,
        "bst": bst,
        "gen": gen_id,
        "height": pokemon_data['height'] / 10, # dm to m
        "weight": pokemon_data['weight'] / 10, # hg to kg
        "isLegendary": is_legendary,
        "isMythical": is_mythical,
        "isPseudo": is_pseudo,
        "evolutionDepth": evolution_depth,
        "evolutionFamily": evolution_family,
        "description": description,
        "sprite": sprite_path,
        "artwork": artwork_path
    }

async def main():
    async with aiohttp.ClientSession() as session:
        # 1. Fetch all evolution chains first
        await fetch_all_evolution_chains(session)
        
        # 2. Get Generations
        gens = await get_generations(session)
        print(f"Found {len(gens)} generations.")

        # 3. Get Species List per Gen
        tasks = []
        gen_metadata = []
        for i, gen in enumerate(gens):
            # Gen ID is i+1 usually, or extract from url
            gen_id = int(gen['url'].split('/')[-2])
            tasks.append(get_species_from_gen(session, gen['url'], gen_id))
        
        results = await asyncio.gather(*tasks)
        all_species_entries = []
        
        for i, (res, region) in enumerate(results):
            all_species_entries.extend(res)
            gen_id = int(gens[i]['url'].split('/')[-2])
            gen_metadata.append({
                'id': gen_id,
                'region': region
            })
            
        print(f"Found {len(all_species_entries)} species total.")
        
        # 4. Process Species (in chunks to avoid rate limits/overload)
        final_pokemon = []
        chunk_size = 50
        for i in range(0, len(all_species_entries), chunk_size):
            chunk = all_species_entries[i:i+chunk_size]
            print(f"Processing chunk {i} to {i+len(chunk)}...")
            tasks = [process_species(session, s) for s in chunk]
            chunk_results = await asyncio.gather(*tasks)
            final_pokemon.extend([r for r in chunk_results if r])
            # Small sleep to be nice to API
            await asyncio.sleep(0.5)

        # Sort by ID
        final_pokemon.sort(key=lambda x: x['id'])

        # Save Pokemon
        print(f"Saving {len(final_pokemon)} pokemon to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_pokemon, f, indent=2)

        # Generate and Save Templates
        templates = []
        # Sort metadata by ID just in case
        gen_metadata.sort(key=lambda x: x['id'])
        
        for gen in gen_metadata:
            gen_id = gen['id']
            region = gen['region']
            
            # Get pokemon IDs for this gen
            pids = [p['id'] for p in final_pokemon if p['gen'] == gen_id]
            pids.sort()
            
            templates.append({
                "name": f"{region} (Gen {gen_id})",
                "description": f"All Pokémon introduced in the {region} region.",
                "pokemonIds": pids
            })
            
        # Add Empty
        templates.append({
            "name": "Empty",
            "description": "Start from scratch.",
            "pokemonIds": []
        })
        
        TEMPLATES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'templates.json')
        print(f"Saving templates to {TEMPLATES_FILE}...")
        with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
            json.dump(templates, f, indent=2)

        print("Done!")

if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    print(f"Duration: {time.time() - start_time:.2f} seconds")
