import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from '../../../components/features/homework/ImageUploader';
import SolutionDisplay from '../../../components/features/homework/SolutionDisplay';
import { analyzeHomeworkImage } from '../../../services/homeworkService';
import { Loader2, X } from 'lucide-react';
import RobotImage from '../../../assets/images/mathbridge-ai-robot.png';

const clickSound = typeof Audio !== 'undefined' ? new Audio('/src/assets/sound/Robot.mp3') : null;

const HomeworkHelperPage: React.FC = () => {
  const [solution, setSolution] = useState<string | null>(null);
  const [hint, setHint] = useState<string | string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Robot states
  const [showRobot, setShowRobot] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 380 : 0,
    y: 100,
  });
  const dragRef = useRef<HTMLDivElement>(null);

  // Tương tác robot
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isDizzy, setIsDizzy] = useState(false);
  const [isSpinningMad, setIsSpinningMad] = useState(false);

  // Typing animation
  const introText = "I am the AI of MathBridge website, I only guide you to solve exercises but do not provide you with answers.";
  const guideText = "Please upload a photo of a math problem and get an instant step-by-step solution.";

  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'guide' | 'idle'>('intro');

  // Câu nói
  const funnyReactions = [
    "Ouch! That tickles!", "Hey! I'm working!", "Keep clicking... I dare you!",
    "Too much fun!", "Stop it! I'm dizzy!", "Boop beep!", "Overheating!",
    "Dance mode activated!", "I'm not a button!", "Loved or bullied?",
  ];
  const dizzyReactions = ["Ughhh... too much...", "Circuits spinning...", "Mercy please...", "I see stars!", "Wheeeee~", "Balance not found..."];
  const overloadReactions = ["OVERLOAD!!!", "CAN'T TAKE IT!!!", "SYSTEM FAILURE!!!", "REBOOTING..."];

  // Phát âm thanh
  const playClickSound = () => {
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.volume = 0.7;
      clickSound.play().catch(() => {});
    }
  };

  // Reset robot về trạng thái ban đầu 
  const resetRobot = () => {
    setClickCount(0);
    setIsDizzy(false);
    setIsSpinningMad(false);
    setHasBeenClicked(false);
    setPhase('intro');
    setDisplayedText("");
    setCurrentIndex(0);
  };

  const handleRobotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();

    setHasBeenClicked(true);
    setPhase('idle');

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Click ≥ 20 lần → Xoay điên + tự động reset 
    if (newCount >= 20) {
      setIsSpinningMad(true);
      setDisplayedText(overloadReactions[Math.floor(Math.random() * overloadReactions.length)]);

      setTimeout(() => {
        resetRobot();
      }, 3000); 

      return;
    }

    // 12–19 lần → Xoay điên bình thường
    if (newCount >= 12 && !isSpinningMad) {
      setIsSpinningMad(true);
      setDisplayedText("I'M LOSING IT!!!");
      setTimeout(() => setIsSpinningMad(false), 5000);
    }
    // 7–11 lần → Dizzy
    else if (newCount >= 7 && newCount < 12) {
      if (!isDizzy) {
        setIsDizzy(true);
        setDisplayedText(dizzyReactions[Math.floor(Math.random() * dizzyReactions.length)]);
        setTimeout(() => {
          setIsDizzy(false);
          setDisplayedText("I'm... okay now...");
        }, 4000);
      }
    }
    // Dưới 7 lần → Vui vẻ
    else {
      setDisplayedText(funnyReactions[Math.floor(Math.random() * funnyReactions.length)]);
    }

    // Rung nhẹ mỗi lần click
    if (dragRef.current) {
      dragRef.current.classList.add('animate-shake-once');
      setTimeout(() => dragRef.current?.classList.remove('animate-shake-once'), 600);
    }
  };

  const isOnLeftSide = typeof window !== 'undefined' && position.x < window.innerWidth / 2;

  // Typing effect
  useEffect(() => {
    if (!showRobot || isDizzy || isSpinningMad || hasBeenClicked) return;

    const text = phase === 'intro' ? introText : guideText;

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 45);
      return () => clearTimeout(timer);
    }

    if (phase === 'intro' && currentIndex >= introText.length) {
      setTimeout(() => {
        setPhase('guide');
        setDisplayedText("");
        setCurrentIndex(0);
      }, 1500);
    }

    if (phase === 'guide' && currentIndex >= guideText.length) {
      setTimeout(() => setPhase('idle'), 1000);
    }
  }, [currentIndex, phase, showRobot, isDizzy, isSpinningMad, hasBeenClicked]);

  // Dragging
  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => {
      setPosition(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    };
    const up = () => setIsDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [isDragging]);

  // Resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(p => ({
        x: Math.min(p.x, window.innerWidth - 400),
        y: Math.max(50, Math.min(p.y, window.innerHeight - 200)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CSS động (không còn hiệu ứng rơi)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('robot-full-fx')) return;

    const style = document.createElement('style');
    style.id = 'robot-full-fx';
    style.innerHTML = `
      @keyframes spin-mad { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes spin-super-fast { from { transform: rotate(0deg); } to { transform: rotate(1440deg); } }
      @keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-12px)} 20%,40%,60%,80%{transform:translateX(12px)} }
      @keyframes shake-once { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-8px)} 20%,40%,60%,80%{transform:translateX(8px)} }
      .animate-spin-mad { animation: spin-mad 0.18s linear infinite !important; }
      .animate-spin-super-fast { animation: spin-super-fast 1.5s linear 1 !important; }
      .animate-shake { animation: shake 0.5s ease-in-out infinite; }
      .animate-shake-once { animation: shake-once 0.6s ease-in-out; }
      .animate-ping-slow { animation: ping 4s cubic-bezier(0,0,0.2,1) infinite; }
      .animate-bounce-slow { animation: bounce 3s infinite; }
    `;
    document.head.appendChild(style);
  }, []);

  // Xử lý ảnh
  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
    setSolution(null);
    setHint(null);
    setError(null);
  };

  const handleImageCleared = () => {
    setSelectedFile(null);
    setSolution(null);
    setHint(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    setSolution(null);
    setHint(null);
    try {
      const response = await analyzeHomeworkImage(selectedFile);
      if (response.latex) setSolution(response.latex);
      else if (typeof response === 'string') setSolution(response);
      if (response.hint) setHint(response.hint);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Khi robot bị tắt thủ công (ấn nút X)
  if (!showRobot) {
    return (
      <>
        {/* Subtle Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-primary/15 text-7xl font-light select-none animate-float"
                style={{
                  left: `${10 + (i * 70) % 85}%`,
                  top: `${15 + (i * 55) % 80}%`,
                  animationDelay: `${i * 3}s`,
                }}
              >
                {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-screen bg-gradient-to-b from-background-cream via-white to-gray-50 relative">
          <button
            onClick={() => {
              setShowRobot(true);
              resetRobot();
            }}
            className="fixed top-80 right-6 z-50 bg-primary hover:bg-primary-dark text-white rounded-full p-5 shadow-math-lg transition-all hover:scale-110 animate-bounce"
          >
            <img src={RobotImage} alt="Wake robot" className="w-14 h-14 rounded-full" />
          </button>

          <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 min-h-screen">
            <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
              <div className="mb-12">
                <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-8 sm:p-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg text-center">
                      MathBridge AI Assistant
                    </h1>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 md:p-10">
                <ImageUploader onImageSelected={handleImageSelected} onImageCleared={handleImageCleared} isLoading={isLoading} />
                {selectedFile && (
                  <div className="mt-8 flex justify-center">
                    <button onClick={handleAnalyze} disabled={isLoading}
                      className={`flex items-center gap-3 px-9 py-4 text-lg font-bold text-white rounded-xl transition-all ${isLoading ? 'bg-primary/50' : 'bg-primary hover:bg-primary-dark shadow-math hover:shadow-math-lg'}`}>
                      {isLoading ? <>Analyzing...</> : <>Start Solving</>}
                    </button>
                  </div>
                )}
                <SolutionDisplay solution={solution} hint={hint} error={error} />
              </div>
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
          .animate-float { animation: float 25s linear infinite; }
        `}} />
      </>
    );
  }

  return (
    <>
      {/* Subtle Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-primary/15 text-7xl font-light select-none animate-float"
              style={{
                left: `${10 + (i * 70) % 85}%`,
                top: `${15 + (i * 55) % 80}%`,
                animationDelay: `${i * 3}s`,
              }}
            >
              {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-screen bg-gradient-to-b from-background-cream via-white to-gray-50 relative">

      <div
        ref={dragRef}
        className={`fixed z-50 flex items-start gap-5 select-none transition-all ${
          isSpinningMad ? 'animate-spin-mad' : ''
        } ${isDizzy ? 'animate-shake' : ''}`}
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.tagName === 'IMG') return;
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        {/* Bong bóng chat */}
        <div className={`relative bg-white rounded-2xl shadow-2xl p-4 max-w-xs border border-indigo-100 ${isOnLeftSide ? 'order-2' : 'order-1'}`}>
          <div className="text-sm md:text-base font-medium text-gray-800 leading-relaxed min-h-[3rem]">
            {displayedText || (!hasBeenClicked && phase !== 'idle' ? '' : '\u00A0')}
            {phase !== 'idle' && !hasBeenClicked && !isDizzy && !isSpinningMad && (
              <span className="inline-block w-2 h-5 bg-indigo-600 ml-1 animate-pulse" />
            )}
          </div>
          <div
            className={`absolute top-7 ${isOnLeftSide ? 'left-[-12px]' : '-right-3'} w-0 h-0`}
            style={{
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderLeft: isOnLeftSide ? 'none' : '12px solid white',
              borderRight: isOnLeftSide ? '12px solid white' : 'none',
            }}
          />
        </div>

        {/* Robot */}
        <div className={`relative ${isOnLeftSide ? 'order-1' : 'order-2'}`}>
          <img
            src={RobotImage}
            alt="MathBridge AI"
            className={`w-28 h-28 md:w-32 md:h-32 object-contain drop-shadow-2xl animate-bounce-slow cursor-pointer transition-all ${
              isSpinningMad ? 'animate-spin-super-fast' : ''
            }`}
            onClick={handleRobotClick}
          />

          {isSpinningMad && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-600 opacity-70 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-50 animate-ping" style={{ animationDelay: '0.3s' }} />
            </>
          )}

          <div className="absolute -inset-2 rounded-full bg-indigo-400 opacity-15 blur-md pointer-events-none" />
          <div className="absolute -inset-3 rounded-full bg-indigo-500 opacity-20 animate-ping-slow pointer-events-none" />

          {/* Nút Close thủ công */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDisplayedText("Okay, I'm out!");
              setTimeout(() => setShowRobot(false), 600);
            }}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg z-10 transition-all hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

        {/* Nội dung trang chính */}
        <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 min-h-screen">
          <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
            <div className="mb-12">
              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-8 sm:p-10">
                  <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg text-center">
                    MathBridge AI Assistant
                  </h1>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 md:p-10">
              <ImageUploader onImageSelected={handleImageSelected} onImageCleared={handleImageCleared} isLoading={isLoading} />
              {selectedFile && (
                <div className="mt-8 flex justify-center">
                  <button onClick={handleAnalyze} disabled={isLoading}
                    className={`flex items-center gap-3 px-9 py-4 text-lg font-bold text-white rounded-xl transition-all ${isLoading ? 'bg-primary/50' : 'bg-primary hover:bg-primary-dark shadow-math hover:shadow-math-lg'}`}>
                    {isLoading ? (
                      <> <Loader2 className="w-6 h-6 animate-spin" /> Analyzing... </>
                    ) : (
                      <> Start Solving </>
                    )}
                  </button>
                </div>
              )}
              <SolutionDisplay solution={solution} hint={hint} error={error} />
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 25s linear infinite; }
      `}} />
    </>
  );
};

export default HomeworkHelperPage;