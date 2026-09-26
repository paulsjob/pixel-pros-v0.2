import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Pixel Pros:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full bg-[#0b1021] text-[#fae5b8] flex flex-col items-center justify-center p-4 selection:bg-[#12579b]">
          <div className="max-w-md w-full pixel-box-cream p-6 rounded-xs text-center space-y-4 shadow-[0_8px_0_0_#050811]">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-[#b91c1c] border-2 border-[#78350f] rounded-xs flex items-center justify-center text-white">
                <AlertTriangle size={28} />
              </div>
            </div>

            <h1 className="font-pixel text-lg text-[#5c3509] tracking-wider uppercase">
              GAME PAUSED • 8-BIT ERROR
            </h1>

            <p className="font-retro text-xs text-[#784610] leading-relaxed">
              A temporary glitch occurred on the field. Don&apos;t worry, your roster and stats can be reloaded safely.
            </p>

            {this.state.error && (
              <div className="bg-[#ebd2a4] p-2.5 border border-[#c99a57] rounded-xs font-mono text-[10px] text-[#78350f] text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="touch-manipulation w-full py-2.5 px-4 bg-[#12579b] hover:bg-[#0e4881] text-[#fae5b8] border-2 border-[#0a2d52] font-pixel text-xs tracking-wider uppercase cursor-pointer shadow-[0_3px_0_0_#051a30] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              RESET & RESUME PLAY
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
