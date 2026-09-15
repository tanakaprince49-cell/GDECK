import React from 'react';
import { Plus, ArrowDownToLine, Type, Image as ImageIcon, Video, SplitSquareVertical } from 'lucide-react';

interface FormsFloatingBarProps {
  onAddQuestion: () => void;
  onAddTitle: () => void;
  onAddImage: () => void;
}

export const FormsFloatingBar: React.FC<FormsFloatingBarProps> = ({
  onAddQuestion,
  onAddTitle,
  onAddImage,
}) => {
  return (
    <div
      aria-label="Form edit tools"
      className="bg-white rounded-2xl shadow-lg md:shadow-md border border-[#dadce0] p-1.5 flex flex-row md:flex-col gap-1 sm:gap-1.5 select-none shrink-0 text-[#5f6368] fixed bottom-4 left-1/2 -translate-x-1/2 md:sticky md:top-24 md:bottom-auto md:left-auto md:translate-x-0 z-40"
    >
      <button
        onClick={onAddQuestion}
        className="p-2 sm:p-2.5 hover:bg-[#f0f4f9] hover:text-[#1a73e8] rounded-xl transition-colors cursor-pointer"
        title="Add question"
      >
        <Plus className="w-5 h-5" />
      </button>

      <button
        onClick={() => alert('Import questions from other Google Forms')}
        className="p-2 sm:p-2.5 hover:bg-[#f0f4f9] hover:text-[#1a73e8] rounded-xl transition-colors cursor-pointer hidden xs:block"
        title="Import questions"
      >
        <ArrowDownToLine className="w-5 h-5" />
      </button>

      <button
        onClick={onAddTitle}
        className="p-2 sm:p-2.5 hover:bg-[#f0f4f9] hover:text-[#1a73e8] rounded-xl transition-colors cursor-pointer"
        title="Add title and description"
      >
        <Type className="w-5 h-5" />
      </button>

      <button
        onClick={onAddImage}
        className="p-2 sm:p-2.5 hover:bg-[#f0f4f9] hover:text-[#1a73e8] rounded-xl transition-colors cursor-pointer"
        title="Add image"
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      <button
        onClick={() => alert('Add YouTube video')}
        className="p-2 sm:p-2.5 hover:bg-[#f0f4f9] hover:text-[#1a73e8] rounded-xl transition-colors cursor-pointer hidden sm:block"
        title="Add video"
      >
        <Video className="w-5 h-5" />
      </button>

      <button
        onClick={() => alert('Add section')}
        className="p-2 sm:p-2.5 hover:bg-[#f0f4f9] hover:text-[#1a73e8] rounded-xl transition-colors cursor-pointer hidden sm:block"
        title="Add section"
      >
        <SplitSquareVertical className="w-5 h-5" />
      </button>
    </div>
  );
};
