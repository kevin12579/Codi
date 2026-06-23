import React, { useEffect, useState, useCallback } from "react";

export default function SessionManager({ children, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(600); // 10분 = 600초

    const resetTimer = useCallback(() => {
        setTimeLeft(600);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
            clearInterval(timer);
            if (onTimeout) onTimeout();
            return 0;
            }
            return prev - 1;
        });
        }, 1000);

        window.addEventListener("click", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("scroll", resetTimer);

        return () => {
        clearInterval(timer);
        window.removeEventListener("click", resetTimer);
        window.removeEventListener("keydown", resetTimer);
        window.removeEventListener("scroll", resetTimer);
        };
    }, [resetTimer, onTimeout]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <>
        {typeof children === "function" ? children({ timeLeft, formatTime }) : children}
        </>
    );
}