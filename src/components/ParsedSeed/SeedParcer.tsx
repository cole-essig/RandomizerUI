import React, { useState } from "react";
import { parseSeedFile } from "../../utils/ParsedSeed.ts";
import type { ParsedSeed } from "../../utils/ParsedSeed.ts";

function SeedUploader() {
  const [parsed, setParsed] = useState<ParsedSeed | null>(null);
  const [isParsed, setIsParsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    console.log("Parsed result:", result);
    console.log("Locations length:", result.locations?.length);
    setParsed(result);
    setIsParsed(true);
  };

  // Function to render parsed seed data
  const renderParsedSeed = (data: ParsedSeed) => {
    return (
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-blue-400 text-lg font-bold mb-2">Seed Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-blue-300">Seed:</span> <span className="text-white">{data.seed || 'N/A'}</span></div>
            <div><span className="text-blue-300">Settings String:</span> <span className="text-white break-all">{data.settingsString || 'N/A'}</span></div>
          </div>
        </div>

        {/* Settings */}
        {Object.keys(data.settings).length > 0 && (
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-blue-400 text-lg font-bold mb-2">Settings</h3>
            {renderTable(data.settings)}
          </div>
        )}

        {/* Locations by Region */}
        {data.locations && data.locations.length > 0 && (
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-blue-400 text-lg font-bold mb-2">Locations</h3>
            {data.locations.map((region, idx) => (
              <div key={idx} className="mb-4">
                <h4 className="text-green-400 font-semibold">{region.region} ({region.count})</h4>
                {region.locations.length > 0 && (
                  <table className="border text-white border-gray-400 my-2 w-full">
                    <thead>
                      <tr>
                        <th className="border text-blue-500 px-2 py-1 text-left">Location</th>
                        <th className="border text-blue-500 px-2 py-1 text-left">Item</th>
                      </tr>
                    </thead>
                    <tbody>
                      {region.locations.map((location, locIdx) => (
                        <tr key={locIdx}>
                          <td className="border px-2 py-1">{location.name}</td>
                          <td className="border px-2 py-1">{location.item}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}

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
        <table className="border text-white border-gray-400 my-2">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className="border text-blue-500 px-2 py-1">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx}>
                {headers.map((header) => (
                  <td key={header} className="border px-2 py-1">
                    {typeof row[header] === "object" && row[header] !== null
                      ? renderTable(row[header])
                      : String(row[header] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
      {isParsed && parsed && <div className="mt-4">{renderParsedSeed(parsed)}</div>}
    </div>
  );
}

export default SeedUploader;

