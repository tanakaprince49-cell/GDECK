import React, { useState, useRef, useEffect } from 'react';
import {
  Square,
  Circle,
  Type,
  Eraser,
  Download,
  RotateCcw,
  Palette,
  PenTool,
  ArrowLeft,
  Trash2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GoogleDrawingsIcon } from './GoogleIcons';

interface DrawingsViewProps {
  onBackToOverview?: () => void;
}

export const DrawingsView: React.FC<DrawingsViewProps> = ({ onBackToOverview }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'brush' | 'rectangle' | 'circle' | 'eraser' | 'text'>('brush');
  const [color, setColor] = useState<string>('#4285F4');
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (tool === 'text') {
      const text = prompt('Enter text label:');
      if (text) {
        ctx.font = `${lineWidth * 5 + 12}px sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
      }
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshot) {
      ctx.putImageData(snapshot, 0, 0);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;

      if (tool === 'rectangle') {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `google-drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div id="drawings-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-red-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-red-500/10 border border-red-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleDrawingsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Drawings</h2>
            <p className="text-sm text-slate-500">Vector diagrams, sketches, whiteboarding & annotations</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadDrawing}
            className="px-4 py-2.5 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-xl shadow-xs border border-red-400/40 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
          <a
            href="https://docs.google.com/drawings"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-red-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Drawings Web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Canvas & Toolbox */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl">
            <button
              onClick={() => setTool('brush')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'brush' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Brush</span>
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'rectangle' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Square className="w-4 h-4" />
              <span>Rectangle</span>
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'circle' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span>Circle</span>
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'text' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'eraser' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Color & Size Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#9C27B0', '#212121'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 ${
                    color === c ? 'border-slate-800 scale-110' : 'border-white'
                  } transition-transform cursor-pointer shadow-xs`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Size:</span>
              <input
                type="range"
                min={1}
                max={20}
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-20 accent-red-600 cursor-pointer"
              />
              <span>{lineWidth}px</span>
            </div>

            <button
              onClick={clearCanvas}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawing Board */}
        <div className="flex justify-center overflow-x-auto p-2 bg-slate-50/60 rounded-2xl border border-slate-200/80">
          <canvas
            ref={canvasRef}
            width={900}
            height={520}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            className="bg-white rounded-xl shadow-md border border-slate-200 cursor-crosshair max-w-full"
          />
        </div>
      </div>
    </div>
  );
};
