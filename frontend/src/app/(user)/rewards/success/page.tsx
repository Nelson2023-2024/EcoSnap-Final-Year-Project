"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { CheckCircle, ArrowRight, HandHeart } from "lucide-react";

interface PurchaseSuccessPageProps {
  searchParams: { productName?: string };
}

const PurchaseSuccessPage = ({ searchParams }: PurchaseSuccessPageProps) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Play cheers sound
    const audio = new Audio("/sounds/cheers.mp3");
    audio.volume = 0.5;
    audio.loop = false;
    audio.play().catch((err) => console.log("Audio play failed:", err));

    // Stop confetti and sound after 10 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
      audio.pause();
      audio.currentTime = 0; // reset
    }, 10000); // 10000ms = 10 seconds

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  if (!mounted) return null;

  const productName = searchParams.productName || "your item";

  return (
    <div className="h-screen flex items-center justify-center px-4 bg-background">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          gravity={0.1}
          numberOfPieces={700}
          recycle={false}
          style={{ zIndex: 1 }}
        />
      )}

      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center">
            <CheckCircle className="text-emerald-400 w-16 h-16 mb-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2">
            Redeemed Successfully!
          </h1>
          <p className="text-gray-300 text-center mb-2">
            You have redeemed <strong>{productName}</strong>.
          </p>
          <p className="text-emerald-400 text-center text-sm mb-6">
            Check your points balance in your account.
          </p>

          <div className="space-y-4">
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4
             rounded-lg transition duration-300 flex items-center justify-center"
              onClick={() => router.push("/user/rewards")}
            >
              <HandHeart className="mr-2" size={18} />
              Back to Rewards
            </button>

            <button
              className="w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 
            rounded-lg transition duration-300 flex items-center justify-center"
              onClick={() => router.push("/")}
            >
              Continue Shopping
              <ArrowRight className="ml-2" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;
