import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Bot, User, Loader2, Info, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Trip, Stop, Activity } from '../types';

interface TravelCopilotProps {
  trip: Trip;
  stops: Stop[];
  activities: { [stopId: string]: Activity[] };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function TravelCopilot({ trip, stops, activities }: TravelCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('INFINITY_GEMINI_KEY') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial greeting
  useEffect(() => {
    const cityName = stops[0]?.cityName || 'your destination';
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `👋 Hello! I am **Infinity Co-Pilot**, your personal AI travel expert for your upcoming journey to **${cityName}**.\n\nI have fully reviewed your itinerary, stops, and budget of **$${trip.budgetLimit?.toLocaleString() || 0}**. What can I help you with today? I can suggest local secrets, draft rainy day plans, translate common words, or optimize your routes!`,
        timestamp: new Date()
      }
    ]);
  }, [stops, trip]);

  const activeKey = customKey || process.env.GEMINI_API_KEY || '';

  const getGeminiEngine = () => {
    if (!activeKey) {
      throw new Error("Missing API Key");
    }
    return new GoogleGenAI({ apiKey: activeKey });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (!activeKey) {
        setShowKeyInput(true);
        throw new Error("API Key is required to chat with Co-Pilot.");
      }

      const engine = getGeminiEngine();
      
      // Construct dynamic trip context to instruct the AI model
      const itinerarySummary = stops.map((s, idx) => {
        const stopActs = activities[s.id] || [];
        const actSummary = stopActs.map(a => `- ${a.title} ($${a.cost})`).join('\n');
        return `Stop #${idx + 1}: ${s.cityName}\nActivities:\n${actSummary || 'None planned yet'}`;
      }).join('\n\n');

      const systemPrompt = `You are "Infinity Co-Pilot", a world-class elite travel concierge and highly knowledgeable local guide.
Trip Context:
- Trip Title: ${trip.title}
- Main Destination: ${stops.map(s => s.cityName).join(', ')}
- Trip Dates: ${trip.startDate?.toDate ? trip.startDate.toDate().toDateString() : 'N/A'} to ${trip.endDate?.toDate ? trip.endDate.toDate().toDateString() : 'N/A'}
- Overall Budget Limit: $${trip.budgetLimit || 0}
- Current Planned Itinerary & Stops:
${itinerarySummary}

Instructions:
1. Provide extremely practical, authentic, and culturally rich recommendations.
2. Structure your replies beautifully with headers, bullet points, and clean bold text.
3. Be highly empathetic and responsive to budget constraints.
4. Always speak in a warm, inspirational, and professional tone.
5. If the user mentions any unexpected event (e.g. rain, cancelation, getting lost), offer reassuring and actionable backup options.
6. Keep recommendations concise so it is easy to read on the go.`;

      // Build history of chat
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Append current user message
      chatHistory.push({
        role: 'user',
        parts: [{ text: textToSend }]
      });

      const response = await engine.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: textToSend,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: systemPrompt,
        }
      });

      const replyText = response.text;
      if (!replyText) {
        throw new Error("No response received from Co-Pilot. Please try again.");
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date()
      }]);

    } catch (error: any) {
      console.error('[Co-Pilot Error]', error);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        sender: 'assistant',
        text: `⚠️ **Error**: ${error?.message || 'Something went wrong.'} Please ensure your Gemini API key is correct.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('INFINITY_GEMINI_KEY', customKey);
    setShowKeyInput(false);
    setMessages(prev => [...prev, {
      id: 'key-saved',
      sender: 'assistant',
      text: "🔑 **Gemini API Key Saved!** You can now talk to me. Go ahead, ask me anything!",
      timestamp: new Date()
    }]);
  };

  const clearCustomKey = () => {
    localStorage.removeItem('INFINITY_GEMINI_KEY');
    setCustomKey('');
    setShowKeyInput(true);
  };

  const quickPrompts = [
    { label: "🌧️ Rainy day backup plan", text: "Create a detailed rainy day backup plan for my current stops, keeping the activities indoor-friendly." },
    { label: "🍕 Must-try street food", text: "Recommend 5 must-try authentic street foods or local delicacies that I should search for on this trip." },
    { label: "🗣️ Essential phrases", text: "Give me the top 5 most important local phrases or customs I should know for this destination." },
    { label: "💰 Tipping & Taxis custom", text: "Explain how tipping works here, and suggest the safest, cheapest local transportation options." },
    { label: "🔄 Route optimization", text: "Suggest the most efficient order to visit my planned attractions to minimize travel time." }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-280px)] min-h-[500px]">
      
      {/* Left Panel: Tips & API Key Status */}
      <div className="lg:col-span-1 flex flex-col justify-between bg-white rounded-[40px] p-8 border border-black/5 shadow-sm space-y-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">AI Co-Pilot</h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-black/35">Real-time Helper</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
              <p className="text-xs text-orange-800 leading-relaxed">
                💡 **Pro Tip**: If a flight is delayed or an attraction is fully booked, type it here! I will instantly adjust your schedule.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Trip Scope</h4>
              <div className="text-xs text-black/60 space-y-1 bg-black/[0.02] p-4 rounded-2xl">
                <p>📍 **Destination**: {stops.map(s => s.cityName).join(' ➔ ') || 'N/A'}</p>
                <p>📅 **Stops**: {stops.length} Days</p>
                <p>💰 **Budget**: ${trip.budgetLimit || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Key management */}
        <div className="pt-6 border-t border-black/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Gemini Connection</span>
            {activeKey ? (
              <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100">Connected</span>
            ) : (
              <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full border border-amber-100">Setup Required</span>
            )}
          </div>
          
          {showKeyInput || !activeKey ? (
            <form onSubmit={handleSaveCustomKey} className="space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                <Input
                  type="password"
                  placeholder="Gemini API Key"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl bg-black/5 border-none"
                  required
                />
              </div>
              <Button type="submit" size="sm" className="w-full bg-black text-white hover:bg-black/90 text-[10px] font-bold tracking-wider uppercase h-10 rounded-xl">
                Save API Key
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs bg-black/[0.02] p-3 rounded-2xl">
              <span className="font-semibold text-black/40">••••••••••••{activeKey.slice(-4)}</span>
              <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50" onClick={clearCustomKey} title="Change API Key">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <p className="text-[9px] text-black/30 text-center leading-tight">
            Key is stored safely in your browser local storage.
          </p>
        </div>
      </div>

      {/* Right Panel: Chat Console */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-[40px] border border-black/5 shadow-sm overflow-hidden h-full">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-sm border border-black/10">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-[28px] p-6 text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-[#F5F2ED] text-black rounded-tl-none font-medium'
                }`}>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  <span className={`text-[9px] block mt-3 font-semibold ${msg.sender === 'user' ? 'text-white/40 text-right' : 'text-black/30'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center shrink-0 border border-black/5">
                    <User className="w-5 h-5 text-black/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 animate-spin">
                <Loader2 className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#F5F2ED] text-black rounded-[28px] rounded-tl-none p-6 text-sm leading-relaxed max-w-[75%] font-medium flex items-center gap-3">
                <span className="text-black/50 italic animate-pulse">Infinity Co-Pilot is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-8 pb-4 flex flex-wrap gap-2 overflow-x-auto shrink-0">
            {quickPrompts.map((chip, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSendMessage(chip.text)}
                className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#F5F2ED] hover:bg-black hover:text-white border border-black/5 text-black/70 transition-all shadow-sm"
              >
                {chip.label}
              </motion.button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-6 border-t border-black/5 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex gap-3 items-center"
          >
            <Input
              placeholder="Ask Co-Pilot (e.g. Find dynamic indoor stops, translations, transport schedules)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 h-14 rounded-full bg-[#F5F2ED] border-none px-8 font-medium placeholder:text-black/30 focus-visible:ring-black"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="h-14 w-14 rounded-full bg-black text-white hover:bg-black/90 shrink-0 shadow-lg hover:shadow-black/10 transition-transform active:scale-95"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
