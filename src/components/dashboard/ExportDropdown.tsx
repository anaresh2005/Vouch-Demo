import { Download, FileText, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportDropdownProps {
  onExportPDF: () => void;
  onExportMarkdown: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function ExportDropdown({
  onExportPDF,
  onExportMarkdown,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  className = '',
}: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${size === 'icon' ? 'h-8 w-8' : 'h-6 px-2 gap-1.5'} text-muted-foreground hover:text-foreground ${className}`}
          title="Export options"
        >
          <Download className={showLabel ? 'h-3 w-3' : 'h-4 w-4'} />
          {showLabel && <span className="text-xs">Export</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Export as PDF</span>
            <span className="text-xs text-muted-foreground">Printable report</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportMarkdown} className="gap-2 cursor-pointer">
          <FileCode className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Export as Markdown</span>
            <span className="text-xs text-muted-foreground">For LLM consumption</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
