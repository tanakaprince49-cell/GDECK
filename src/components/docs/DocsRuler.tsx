import React from 'react';

interface DocsRulerProps {
  zoom?: string;
}

export const DocsRuler: React.FC<DocsRulerProps> = () => {
  // 816px total paper width:
  // 96px left margin (1 inch)
  // 624px text body (6.5 inches)
  // 96px right margin (1 inch)
  const totalInches = 8.5;
  const pixelsPerInch = 96;

  // Generate marks for 8.5 inches
  const inches = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="w-full flex justify-center bg-[#f9fbfd] select-none border-b border-[#dadce0] overflow-hidden py-1">
      <div
        className="w-[816px] h-4 bg-[#e8eaed] relative flex items-end border-l border-r border-[#dadce0] shadow-xs text-[9px] font-mono text-[#5f6368]"
        style={{ width: '816px' }}
      >
        {/* Active printable area (between 1" and 7.5") */}
        <div
          className="absolute top-0 bottom-0 bg-white border-l border-r border-[#bdc1c6]"
          style={{ left: '96px', width: '624px' }}
        />

        {/* Inch markers and tick subdivisions */}
        {Array.from({ length: 68 }).map((_, idx) => {
          const pos = (idx * pixelsPerInch) / 8; // every 1/8 inch = 12px
          const isFullInch = idx % 8 === 0;
          const isHalfInch = idx % 4 === 0 && !isFullInch;
          const isQuarterInch = idx % 2 === 0 && !isHalfInch && !isFullInch;
          const inchNum = idx / 8;

          return (
            <div
              key={idx}
              className="absolute bottom-0 flex flex-col items-center pointer-events-none"
              style={{ left: `${pos}px` }}
            >
              {isFullInch && inchNum >= 1 && inchNum <= 7 && (
                <span className="absolute -top-3.5 -translate-x-1/2 text-[9px] font-sans font-medium text-[#444746]">
                  {inchNum}
                </span>
              )}
              <div
                className={`w-px ${
                  isFullInch
                    ? 'h-2 bg-[#5f6368]'
                    : isHalfInch
                    ? 'h-1.5 bg-[#80868b]'
                    : isQuarterInch
                    ? 'h-1 bg-[#bdc1c6]'
                    : 'h-0.5 bg-[#dadce0]'
                }`}
              />
            </div>
          );
        })}

        {/* Authentic Google Docs Left Indent Markers (Blue Rectangle + Down Triangle at 1" / 96px) */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center cursor-ew-resize group z-10"
          style={{ left: '96px' }}
          title="First line indent & Left indent"
        >
          {/* First line indent (rectangle) */}
          <div className="w-2.5 h-1 bg-[#1a73e8] rounded-xs shadow-xs" />
          {/* Left indent (inverted triangle) */}
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#1a73e8]" />
        </div>

        {/* Authentic Google Docs Right Indent Marker (Down Triangle at 7.5" / 720px) */}
        <div
          className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center cursor-ew-resize group z-10"
          style={{ left: '720px' }}
          title="Right indent"
        >
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#1a73e8]" />
        </div>
      </div>
    </div>
  );
};
