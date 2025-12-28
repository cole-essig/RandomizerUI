import React, { useState } from "react";
import { parseSeedFile } from "../../utils/ParsedSeed.ts";
import type { ParsedSeed } from "../../utils/ParsedSeed.ts";

function SeedUploader() {
  const [parsed, setParsed] = useState<ParsedSeed | null>(null);
  const [isParsed, setIsParsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checkedLocations, setCheckedLocations] = useState<Set<string>>(new Set());
  const [checkedGenericRows, setCheckedGenericRows] = useState<Set<string>>(new Set());
  const [checkedEntrances, setCheckedEntrances] = useState<Set<string>>(new Set());
  const [checkedHints, setCheckedHints] = useState<Set<string>>(new Set());
  const [hideSelected, setHideSelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'locations' | 'hints' | 'entrances'>('locations');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setIsParsed(false);
    setParsed(null);
  };

  const handleParse = async () => {
    if (!selectedFile) return;
    const text = await selectedFile.text();
    const result = parseSeedFile(text);
    setParsed(result);
    setIsParsed(true);
  };

  // Function to render parsed seed data
  const renderParsedSeed = (data: ParsedSeed) => {
    return (
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="bg-gray-800 p-4 rounded w-full">
          <h3 className="text-blue-400 text-lg font-bold mb-3">Seed Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-blue-300">Seed:</span> <span className="text-white">{data.seed || 'N/A'}</span></div>
            <div><span className="text-blue-300">Settings String:</span> <span className="text-white break-all">{data.settingsString || 'N/A'}</span></div>
          </div>
        </div>

{/* Tabbed Interface */}
        <div className="bg-gray-800 rounded w-full">
          {/* Tab Navigation */}
          <div className="flex justify-between items-center border-b border-gray-600">
            <div className="flex">
              <button
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'locations'
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                } rounded-tl`}
                onClick={() => setActiveTab('locations')}
              >
                Locations
              </button>
              <button
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'hints'
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                onClick={() => setActiveTab('hints')}
              >
                Hints
              </button>
              <button
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'entrances'
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                onClick={() => setActiveTab('entrances')}
              >
                Entrances
              </button>
            </div>
            <div className="flex items-center gap-2 px-4">
              <input
                type="checkbox"
                id="hideSelected"
                className="w-4 h-4 cursor-pointer"
                checked={hideSelected}
                onChange={(e) => setHideSelected(e.target.checked)}
              />
              <label htmlFor="hideSelected" className="text-white cursor-pointer">
                Hide Selected
              </label>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'locations' && (
              <div>
                <h3 className="text-blue-400 text-lg font-bold mb-3">Locations</h3>
                {data.locations && data.locations.length > 0 && (
                  <div className="space-y-4">
                    {data.locations.map((region, idx) => (
                      <div key={idx}>
                        <h4 className="text-green-400 font-semibold mb-2">{region.region} ({region.count})</h4>
                        {region.locations.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-400 bg-gray-900 text-white">
                              <thead className="bg-gray-700">
                                <tr>
                                  <th className="border border-gray-400 px-3 py-2 text-center text-blue-400 font-semibold w-20">Select</th>
                                  <th className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">Location</th>
                                  <th className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">Item</th>
                                </tr>
                              </thead>
                              <tbody>
                                {region.locations
                                  .map((location, locIdx) => ({ location, locIdx, key: `${idx}-${locIdx}` }))
                                  .filter(({ key }) => !hideSelected || !checkedLocations.has(key))
                                  .map(({ location, locIdx, key }) => {
                                  return (
                                    <tr key={locIdx} className="hover:bg-gray-800">
                                      <td className="border border-gray-400 px-3 py-2 text-center">
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4 cursor-pointer"
                                          checked={checkedLocations.has(key)}
                                          onChange={(e) => {
                                            const newChecked = new Set(checkedLocations);
                                            if (e.target.checked) {
                                              newChecked.add(key);
                                            } else {
                                              newChecked.delete(key);
                                            }
                                            setCheckedLocations(newChecked);
                                          }}
                                        />
                                      </td>
                                      <td className="border border-gray-400 px-3 py-2">{location.name}</td>
                                      <td className="border border-gray-400 px-3 py-2">
                                        {checkedLocations.has(key) ? location.item : '????'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hints' && (
              <div>
                <h3 className="text-blue-400 text-lg font-bold mb-3">Hints</h3>
                {data.hints && data.hints.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-400 bg-gray-900 text-white">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="border border-gray-400 px-3 py-2 text-center text-blue-400 font-semibold w-20">Select</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">Location</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">Hint</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.hints
                          .map((hint, idx) => ({ hint, idx, key: `hint-${idx}` }))
                          .filter(({ key }) => !hideSelected || !checkedHints.has(key))
                          .map(({ hint, idx, key }) => {
                          return (
                            <tr key={idx} className="hover:bg-gray-800">
                              <td className="border border-gray-400 px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 cursor-pointer"
                                  checked={checkedHints.has(key)}
                                  onChange={(e) => {
                                    const newChecked = new Set(checkedHints);
                                    if (e.target.checked) {
                                      newChecked.add(key);
                                    } else {
                                      newChecked.delete(key);
                                    }
                                    setCheckedHints(newChecked);
                                  }}
                                />
                              </td>
                              <td className="border border-gray-400 px-3 py-2">{hint.location}</td>
                              <td className="border border-gray-400 px-3 py-2">
                                {checkedHints.has(key) ? hint.hint : '????'}
                              </td>
                              <td className="border border-gray-400 px-3 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  hint.color === 'purple' ? 'bg-purple-600 text-white' :
                                  hint.color === 'green' ? 'bg-green-600 text-white' :
                                  hint.type === 'foolish' ? 'bg-red-600 text-white' :
                                  'bg-gray-600 text-white'
                                }`}>
                                  {hint.type || 'unknown'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400">No hints data available.</p>
                )}
              </div>
            )}

            {activeTab === 'entrances' && (
              <div>
                <h3 className="text-blue-400 text-lg font-bold mb-3">Entrances</h3>
                {data.entrances && data.entrances.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-400 bg-gray-900 text-white">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="border border-gray-400 px-3 py-2 text-center text-blue-400 font-semibold w-20">Select</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">From</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.entrances
                          .map((entrance, idx) => ({ entrance, idx, key: `entrance-${idx}` }))
                          .filter(({ key }) => !hideSelected || !checkedEntrances.has(key))
                          .map(({ entrance, idx, key }) => {
                          return (
                            <tr key={idx} className="hover:bg-gray-800">
                              <td className="border border-gray-400 px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 cursor-pointer"
                                  checked={checkedEntrances.has(key)}
                                  onChange={(e) => {
                                    const newChecked = new Set(checkedEntrances);
                                    if (e.target.checked) {
                                      newChecked.add(key);
                                    } else {
                                      newChecked.delete(key);
                                    }
                                    setCheckedEntrances(newChecked);
                                  }}
                                />
                              </td>
                              <td className="border border-gray-400 px-3 py-2">{entrance.from}</td>
                              <td className="border border-gray-400 px-3 py-2">
                                {checkedEntrances.has(key) ? entrance.to : '????'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400">No entrances data available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Other sections can be added here */}
      </div>
    );
  };

  // Recursive function to display nested objects or arrays
  const renderTable = (data: any) => {
    if (Array.isArray(data)) {
      const headers = Array.from(
        new Set(data.flatMap((item) => Object.keys(item || {})))
      );
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 bg-gray-900 text-white">
            <thead className="bg-gray-700">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="border border-gray-400 px-3 py-2 text-left text-blue-400 font-semibold">{header}</th>
                ))}
                <th className="border border-gray-400 px-3 py-2 text-center text-blue-400 font-semibold w-20">Select</th>
              </tr>
            </thead>
            <tbody>
              {data
                .map((row: any, idx: number) => ({ row, idx, key: `generic-${idx}-${JSON.stringify(row).slice(0, 50)}` }))
                .filter(({ key }) => !hideSelected || !checkedGenericRows.has(key))
                .map(({ row, idx, key }) => {
                return (
                  <tr key={idx} className="hover:bg-gray-800">
                    {headers.map((header) => (
                      <td key={header} className="border border-gray-400 px-3 py-2">
                        {typeof row[header] === "object" && row[header] !== null
                          ? renderTable(row[header])
                          : String(row[header] ?? "")}
                      </td>
                    ))}
                    <td className="border border-gray-400 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer"
                        checked={checkedGenericRows.has(key)}
                        onChange={(e) => {
                          const newChecked = new Set(checkedGenericRows);
                          if (e.target.checked) {
                            newChecked.add(key);
                          } else {
                            newChecked.delete(key);
                          }
                          setCheckedGenericRows(newChecked);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    } else if (typeof data === "object" && data !== null) {
      return renderTable([data]);
    } else {
      return <span className="text-white">{String(data)}</span>;
    }
  };

  return (
    <div>
      <div className="flex gap-2 items-center">
        <input
          className="bg-gray-200 border border-gray-300 rounded p-2"
          type="file"
          accept=".txt"
          onChange={handleFileSelect}
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleParse}
          disabled={!selectedFile}
        >
          Parse File
        </button>
      </div>
      
      {isParsed && parsed && (
        <div className="mt-4">
          {renderParsedSeed(parsed)}
        </div>
      )}
    </div>
  );
}

export default SeedUploader;

