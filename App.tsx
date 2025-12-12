import React, { useState, useRef, useCallback } from 'react';
import { generateEditedImage } from './services/geminiService';
import { ImageFile, ProcessingState, GeneratedImage } from './types';
import { Button } from './components/Button';
import { Upload, Wand2, Download, RefreshCw, Image as ImageIcon, Sparkles, X, ChevronRight } from 'lucide-react';

const DEFAULT_PROMPT = `Using the reference image, create a hyper-realistic modern oil painting with soft directional lighting. Preserve the outfit details. Add refined brush textures and natural skin tones. Background should be a soft, blurred studio gradient in deep navy and charcoal. Ultra-detailed realism, elegant fine-art finish. Portrait size: 4:5 ratio.`;

const EXAMPLE_IMAGE_URL = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"; 

const App: React.FC = () => {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [resultImage, setResultImage] = useState<GeneratedImage | null>(null);
  const [state, setState] = useState<ProcessingState>({
    isLoading: false,
    error: null,
    stage: 'idle'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSourceImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: reader.result as string,
        mimeType: file.type
      });
      setResultImage(null);
      setState({ isLoading: false, error: null, stage: 'idle' });
    };
    reader.readAsDataURL(file);
  };

  const loadExample = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, stage: 'uploading' }));
      const response = await fetch(EXAMPLE_IMAGE_URL);
      const blob = await response.blob();
      const file = new File([blob], "example_portrait.jpg", { type: "image/jpeg" });
      processFile(file);
    } catch (err) {
      console.error("Failed to load example", err);
      setState(prev => ({ ...prev, error: "Failed to load example image. Please upload one manually." }));
    } finally {
        setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) {
      setState(prev => ({ ...prev, error: "Please upload an image first." }));
      return;
    }
    if (!prompt.trim()) {
      setState(prev => ({ ...prev, error: "Please enter a prompt." }));
      return;
    }

    setState({ isLoading: true, error: null, stage: 'processing' });

    try {
      const result = await generateEditedImage(sourceImage.base64, sourceImage.mimeType, prompt);
      setResultImage(result);
      setState({ isLoading: false, error: null, stage: 'complete' });
    } catch (error: any) {
      setState({ 
        isLoading: false, 
        error: error.message || "Failed to process image. Please try again.", 
        stage: 'idle' 
      });
    }
  };

  const clearAll = () => {
    setSourceImage(null);
    setResultImage(null);
    setPrompt(DEFAULT_PROMPT);
    setState({ isLoading: false, error: null, stage: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-950 to-black text-white selection:bg-primary-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-primary-500 to-purple-600 rounded-lg shadow-lg shadow-primary-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-wide text-white">Artistic Vision</h1>
              <p className="text-xs text-primary-300 uppercase tracking-widest font-semibold">Gemini 2.5 Studio</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <a href="https://ai.google.dev/gemini-api/docs" target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Intro Section */}
        {!sourceImage && (
          <div className="text-center mb-16 max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-100 to-primary-300">
              Transform Reality with AI
            </h2>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Upload a photo and describe your artistic vision. Our advanced Gemini 2.5 Flash model will re-imagine your image with hyper-realistic details, artistic textures, and professional lighting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="primary" 
                className="w-full sm:w-auto text-lg py-4 px-8"
                icon={<Upload className="w-5 h-5" />}
              >
                Upload Photo
              </Button>
              <Button 
                onClick={loadExample} 
                variant="outline"
                className="w-full sm:w-auto text-lg py-4 px-8"
                icon={<ImageIcon className="w-5 h-5" />}
                isLoading={state.isLoading && state.stage === 'uploading'}
              >
                Try Example
              </Button>
            </div>
          </div>
        )}

        {/* Editor Interface */}
        <div className={`transition-all duration-500 ease-in-out ${sourceImage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 hidden'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Input */}
            <div className="space-y-6">
              
              {/* Image Preview Card */}
              <div className="relative group bg-gray-800/30 rounded-2xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm">
                <div className="absolute top-4 right-4 z-10">
                   <button 
                    onClick={clearAll}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
                    title="Clear and start over"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {sourceImage && (
                  <div className="aspect-[4/5] w-full relative">
                    <img 
                      src={sourceImage.previewUrl} 
                      alt="Original" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-sm font-medium text-white">Original Image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                <label className="block text-sm font-medium text-primary-200 mb-2">
                  Artistic Direction
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-700"
                  placeholder="Describe how you want to transform the image..."
                />
                
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Model: <span className="text-primary-400 font-mono">gemini-2.5-flash-image</span>
                  </p>
                  <Button 
                    onClick={handleGenerate} 
                    isLoading={state.isLoading}
                    disabled={!sourceImage}
                    className="w-full sm:w-auto"
                    icon={<Wand2 className="w-4 h-4" />}
                  >
                    {state.isLoading ? 'Creating Masterpiece...' : 'Generate Art'}
                  </Button>
                </div>
                
                {state.error && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm flex items-start">
                    <span className="mr-2">⚠️</span>
                    {state.error}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Result */}
            <div className="relative">
              {!resultImage ? (
                <div className="h-full min-h-[500px] flex items-center justify-center bg-gray-800/20 rounded-2xl border-2 border-dashed border-white/5 p-12 text-center">
                  {state.isLoading ? (
                    <div className="space-y-6 animate-pulse">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary-500/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary-400 animate-spin"></div>
                        <Sparkles className="w-8 h-8 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium text-white mb-2">Processing Vision</h3>
                        <p className="text-gray-400 max-w-xs mx-auto">Applying oil painting textures, lighting adjustments, and color grading...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-gray-500">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                        <ChevronRight className="w-8 h-8 text-white/20" />
                      </div>
                      <p>Your masterpiece will appear here</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="relative group bg-gray-800/30 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary-900/20">
                     <div className="aspect-[4/5] w-full relative">
                      <img 
                        src={resultImage.url} 
                        alt="Generated Art" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                       <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-white font-medium">Generated Result</p>
                            <p className="text-xs text-gray-300">High Resolution • 4:5 Ratio</p>
                          </div>
                          <div className="flex space-x-2">
                             <a 
                              href={resultImage.url} 
                              download="artistic-vision-result.png"
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors backdrop-blur-md"
                              title="Download Image"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setResultImage(null)}
                      icon={<RefreshCw className="w-4 h-4" />}
                    >
                      Generate Another Version
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

    </div>
  );
};

export default App;