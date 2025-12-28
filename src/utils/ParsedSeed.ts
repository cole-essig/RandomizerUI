// utils/parseSeed.ts

export type LocationEntry = {
  region: string;
  count: number;
  locations: { name: string; item: string }[];
};

export type EntranceEntry = {
  from: string;
  to: string;
};

export type HintEntry = {
  location: string;
  hint: string;
  type?: string;
};

export type ParsedSeed = {
  seed: string | null;
  settingsString: string | null;
  settings: Record<string, string | number | boolean>;
  specialConditions: Record<string, any>;
  tricks: string[];
  startingItems: Record<string, number | string>;
  junkLocations: string[];
  worldFlags: Record<string, string[]>;
  entrances: EntranceEntry[];
  hints: HintEntry[];
  locations: LocationEntry[];
};

/**
 * Parse a Zelda Randomizer seed file into structured JSON
 * Works with ootmm-style dumps (Ocarina + Majora randomizer).
 */
export function parseSeedFile(fileContent: string): ParsedSeed {
  // --- Seed Hash ---
  const seedMatch = fileContent.match(/Seed:\s+(\w+)/);
  const seed = seedMatch ? seedMatch[1] : null;

  // --- Settings String ---
  const settingsStringMatch = fileContent.match(/SettingsString:\s+(.+)/);
  const settingsString = settingsStringMatch ? settingsStringMatch[1].trim() : null;

  // --- Settings Block ---
  const settingsBlock = extractBlock(fileContent, "Settings", "Special Conditions");
  const settings = parseKeyValueBlock(settingsBlock);

  // --- Special Conditions Block ---
  const specialBlock = extractBlock(fileContent, "Special Conditions", "Tricks");
  const specialConditions = parseNestedBlock(specialBlock);

  // --- Tricks Block ---
  const tricksBlock = extractBlock(fileContent, "Tricks", "Starting Items");
  const tricks = tricksBlock.split("\n").map(l => l.trim()).filter(Boolean);

  // --- Starting Items ---
  const itemsBlock = extractBlock(fileContent, "Starting Items", "Junk Locations");
  const startingItems = parseKeyValueBlockStringOrNumber(itemsBlock);

  // --- Junk Locations ---
  const junkBlock = extractBlock(fileContent, "Junk Locations", "World Flags");
  const junkLocations = junkBlock.split("\n").map(l => l.trim()).filter(Boolean);

  // --- World Flags ---
  const worldFlagsBlock = extractBlock(fileContent, "World Flags", "Entrances");
  const worldFlags = parseNestedBlock(worldFlagsBlock);

  // --- Entrances ---
  const entrancesBlock = extractBlock(fileContent, "Entrances", "Hints");
  const entrances = parseEntranceList(entrancesBlock);

  // --- Hints ---
  const hintsBlock = extractBlock(fileContent, "Hints", "===========================================================================");
  const hints = parseHintsList(hintsBlock);

  // --- Location List ---
  const locationsBlock = extractBlock(fileContent, "Location List", ""); // until end of file
  const locations = parseLocationList(locationsBlock);

  return {
    seed,
    settingsString,
    settings,
    specialConditions,
    tricks,
    startingItems,
    junkLocations,
    worldFlags,
    entrances,
    hints,
    locations
  };
}

/**
 * Extracts the block of text between two headers
 */
function extractBlock(text: string, start: string, end: string): string {
  if (end) {
    const regex = new RegExp(`${start}[\\s\\S]*?(?=${end})`, "m");
    const match = text.match(regex);
    return match ? match[0].replace(start, "").trim() : "";
  } else {
    // Grab until end of file
    const regex = new RegExp(`${start}[\\s\\S]*`, "m");
    const match = text.match(regex);
    return match ? match[0].replace(start, "").trim() : "";
  }
}

/**
 * Parse a simple key: value block
 */
function parseKeyValueBlock(block: string): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  block.split("\n").forEach(line => {
    const kvMatch = line.trim().match(/^([\w()'". -]+):\s+(.+)$/);
    if (kvMatch) {
      let [, key, val] = kvMatch;
      if (val.toLowerCase() === "true") result[key] = true;
      else if (val.toLowerCase() === "false") result[key] = false;
      else if (/^\d+$/.test(val)) result[key] = Number(val);
      else result[key] = val;
    }
  });
  return result;
}

/**
 * Parse a key: value block, but only allow string or number values (no boolean)
 */
function parseKeyValueBlockStringOrNumber(block: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  block.split("\n").forEach(line => {
    const kvMatch = line.trim().match(/^([\w()'". -]+):\s+(.+)$/);
    if (kvMatch) {
      let [, key, val] = kvMatch;
      if (/^\d+$/.test(val)) result[key] = Number(val);
      else result[key] = val;
    }
  });
  return result;
}

/**
 * Parse indented/nested structures into objects
 */
function parseNestedBlock(block: string): Record<string, any> {
  const result: Record<string, any> = {};
  let currentKey: string | null = null;
  block.split("\n").forEach(line => {
    if (!line.trim()) return;

    // Top-level key
    if (!line.startsWith("  ")) {
      const keyMatch = line.match(/^(\w+):/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        result[currentKey] = {};
      }
    } else if (currentKey) {
      // Nested key-value
      const subMatch = line.trim().match(/^([\w]+):\s+(.+)$/);
      if (subMatch) {
        let [, subKey, val] = subMatch;
        if (val.toLowerCase() === "true") result[currentKey][subKey] = true;
        else if (val.toLowerCase() === "false") result[currentKey][subKey] = false;
        else if (/^\d+$/.test(val)) result[currentKey][subKey] = Number(val);
        else result[currentKey][subKey] = val;
      } else {
        // Lists
        const listMatch = line.trim().match(/^- (.+)$/);
        if (listMatch) {
          if (!Array.isArray(result[currentKey])) result[currentKey] = [];
          result[currentKey].push(listMatch[1]);
        }
      }
    }
  });
  return result;
}

/**
 * Parse Location List into structured data
 */
function parseLocationList(block: string): LocationEntry[] {
  const regions: LocationEntry[] = [];
  let currentRegion: LocationEntry | null = null;

  block.split("\n").forEach(line => {
    if (!line.trim()) return;

    // Region header like "Kokiri Forest (18):"
    const regionMatch = line.match(/^([\w' \-]+)\s+\((\d+)\):$/);
    if (regionMatch) {
      if (currentRegion) regions.push(currentRegion);
      currentRegion = {
        region: regionMatch[1],
        count: Number(regionMatch[2]),
        locations: []
      };
    } else if (currentRegion) {
      // Location line like "OOT Kokiri Forest Cow: Mask of Truth"
      const locMatch = line.match(/^(.*?):\s+(.+)$/);
      if (locMatch) {
        currentRegion.locations.push({ name: locMatch[1], item: locMatch[2] });
      }
    }
  });

  if (currentRegion) regions.push(currentRegion);
  return regions;
}

/**
 * Parse Entrances into structured data
 */
function parseEntranceList(block: string): EntranceEntry[] {
  const entrances: EntranceEntry[] = [];
  
  block.split("\n").forEach(line => {
    if (!line.trim()) return;
    
    // Look for entrance mappings like "From Location -> To Location"
    const entranceMatch = line.match(/^(.*?)\s*->\s*(.+)$/);
    if (entranceMatch) {
      entrances.push({
        from: entranceMatch[1].trim(),
        to: entranceMatch[2].trim()
      });
    } else if (line.includes(":")) {
      // Alternative format like "From Location: To Location"
      const altMatch = line.match(/^(.*?):\s*(.+)$/);
      if (altMatch) {
        entrances.push({
          from: altMatch[1].trim(),
          to: altMatch[2].trim()
        });
      }
    }
  });
  
  return entrances;
}

/**
 * Parse Hints into structured data
 */
function parseHintsList(block: string): HintEntry[] {
  const hints: HintEntry[] = [];
  
  block.split("\n").forEach(line => {
    if (!line.trim()) return;
    
    // Look for hint format like "Location: Hint text"
    const hintMatch = line.match(/^(.*?):\s*(.+)$/);
    if (hintMatch) {
      const location = hintMatch[1].trim();
      const hint = hintMatch[2].trim();
      
      // Try to determine hint type based on content and location
      let type = "general";
      const hintLower = hint.toLowerCase();
      const locationLower = location.toLowerCase();
      
      // Check hint content for type indicators
      if (hintLower.includes("foolish") || hintLower.includes("fool") || 
          hintLower.includes("nothing") || hintLower.includes("useless") ||
          hintLower.includes("no way") || hintLower.includes("not the way")) {
        type = "foolish";
      } else if (hintLower.includes("way of the hero") || hintLower.includes("hero") ||
                 hintLower.includes("path of the hero") || hintLower.includes("heroic")) {
        type = "hero";
      } else if (hintLower.includes("on the way") || hintLower.includes("path") || 
                 hintLower.includes("leads to") || hintLower.includes("points to") ||
                 hintLower.includes("road to") || hintLower.includes("journey")) {
        type = "path";
      } else if (hintLower.includes("sometimes") || hintLower.includes("they say") ||
                 hintLower.includes("it is said") || hintLower.includes("rumor") ||
                 locationLower.includes("gossip") || locationLower.includes("stone")) {
        type = "gossip";
      } else if (hintLower.includes("woth") || hintLower.includes("way of the")) {
        type = "hero";
      } else if (hintLower.includes("barren") || hintLower.includes("nothing")) {
        type = "foolish";
      }
      
      hints.push({ location, hint, type });
    } else if (line.trim().length > 0) {
      // Handle lines that might not have the colon format
      hints.push({ 
        location: "Unknown", 
        hint: line.trim(), 
        type: "general" 
      });
    }
  });
  
  return hints;
}
