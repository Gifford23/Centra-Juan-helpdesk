import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Phone, Mail, Globe, MapPin, ExternalLink, Bot } from "lucide-react";
import botIcon from "../assets/icons/bot.png";

type Message = {
  id: number;
  sender: "bot" | "user";
  content: React.ReactNode;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      content:
        "Hello! Welcome to Central Juan IT Solutions. 👋 How can I assist you today?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Handle User Clicks on Options
  const handleOptionClick = (option: string) => {
    // 1. Add user's message to chat
    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      content: option,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Simulate typing delay, then add bot's response
    setTimeout(() => {
      let botResponse: React.ReactNode = "";

      switch (option) {
        case "Track a Repair":
          botResponse = (
            <div className="flex flex-col gap-2">
              <p>
                You can check the real-time status of your device using your
                Tracking ID or Job Order Number.
              </p>
              <Link
                to="/track"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-xs mt-1 hover:bg-blue-700 transition-colors w-fit"
              >
                Go to Tracking Page <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
          break;
        case "Submit a Ticket":
          botResponse = (
            <div className="flex flex-col gap-2">
              <p>
                Want to skip the line? Register your device online before
                dropping it off!
              </p>
              <Link
                to="/submit-ticket"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-xs mt-1 hover:bg-blue-700 transition-colors w-fit"
              >
                Submit a Request <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
          break;
        case "Contact Information":
          botResponse = (
            <div className="flex flex-col gap-2.5 text-sm">
              <p className="font-medium text-gray-800">
                Here is how you can reach us:
              </p>
              <a
                href="tel:09561793754"
                className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
              >
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <Phone className="w-3.5 h-3.5" />
                </div>{" "}
                0956-179-3754
              </a>
              <a
                href="mailto:centraljuan.net@gmail.com"
                className="flex items-center gap-2 text-blue-600 hover:underline font-medium break-all"
              >
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <Mail className="w-3.5 h-3.5" />
                </div>{" "}
                centraljuan.net@gmail.com
              </a>
              <a
                href="https://centraljuan.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
              >
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <Globe className="w-3.5 h-3.5" />
                </div>{" "}
                www.centraljuan.com
              </a>
            </div>
          );
          break;
        case "Location & Hours":
          botResponse = (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-start gap-2 text-gray-700 font-medium leading-relaxed">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span>
                  190 C.M. Recto Avenue, Highway Barangay Lapasan, Ground Floor,
                  Unit 2, Celinda Bldg., CDO
                </span>
              </div>
              <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Business Hours
                </p>
                <p className="text-sm font-medium text-gray-800">
                  Mon - Sat: 9:00 AM - 6:00 PM
                </p>
                <p className="text-sm font-medium text-gray-800">
                  Sunday: Closed
                </p>
              </div>
            </div>
          );
          break;
        default:
          botResponse =
            "I'm sorry, I didn't understand that. Please select an option below.";
      }

      const botMsg: Message = {
        id: Date.now(),
        sender: "bot",
        content: botResponse,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600); // 600ms delay to feel natural
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-gray-800 text-white rotate-90"
            : "bg-blue-400 text-white hover:bg-blue-300"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <img src={botIcon} alt="Bot" className="w-9 h-9" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-[350px] sm:max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">
                Central Juan Assistant
              </h3>
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>{" "}
                Online
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Options (Instead of typing) */}
          <div className="p-3 bg-white border-t border-gray-100 grid grid-cols-2 gap-2">
            <p className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-1">
              Select an option
            </p>
            <button
              onClick={() => handleOptionClick("Track a Repair")}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-100"
            >
              Track Repair
            </button>
            <button
              onClick={() => handleOptionClick("Submit a Ticket")}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-100"
            >
              Submit Ticket
            </button>
            <button
              onClick={() => handleOptionClick("Contact Information")}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-100"
            >
              Contact Info
            </button>
            <button
              onClick={() => handleOptionClick("Location & Hours")}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-100"
            >
              Location & Hours
            </button>
          </div>
        </div>
      )}
    </>
  );
}
