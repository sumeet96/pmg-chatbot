import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function Chatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMenuData();
    addBotMessage("Hello! I'm your mess menu assistant. I can help you with:\n\n• Today's menu\n• Specific meal information (breakfast, lunch, evening snacks, dinner)\n• Submit feedback or complaints\n• Upcoming week's menu\n\nWhat would you like to know?");
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMenuData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .gte('date', today)
      .lte('date', weekFromNow.toISOString().split('T')[0])
      .order('date')
      .order('meal_type');

    if (data) {
      setMenuItems(data);
    }
  };

  const addBotMessage = (text: string) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const addUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  const formatMenuItem = (item: MenuItem) => {
    const mealTypes: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      evening_snacks: 'Evening Snacks',
      dinner: 'Dinner',
    };

    return `${mealTypes[item.meal_type]}: ${item.item_name}${item.description ? ` - ${item.description}` : ''}`;
  };

  const getTodayMenu = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayItems = menuItems.filter(item => item.date === today);

    if (todayItems.length === 0) {
      return "Sorry, I don't have today's menu available yet. The admin will update it soon!";
    }

    const mealOrder = { breakfast: 1, lunch: 2, evening_snacks: 3, dinner: 4 };
    const sortedItems = todayItems.sort((a, b) => mealOrder[a.meal_type] - mealOrder[b.meal_type]);

    let response = "Here's today's menu:\n\n";
    sortedItems.forEach(item => {
      response += `🍽️ ${formatMenuItem(item)}\n`;
    });

    return response;
  };

  const getMealInfo = (mealType: string) => {
    const today = new Date().toISOString().split('T')[0];
    const meal = menuItems.find(item => item.date === today && item.meal_type === mealType);

    if (!meal) {
      return `Sorry, I don't have information about ${mealType} yet.`;
    }

    const mealTypes: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      evening_snacks: 'Evening Snacks',
      dinner: 'Dinner',
    };

    let response = `Here's what we have for ${mealTypes[mealType]}:\n\n`;
    response += `🍽️ ${meal.item_name}\n`;
    if (meal.description) {
      response += `📝 ${meal.description}`;
    }

    return response;
  };

  const getWeekMenu = () => {
    if (menuItems.length === 0) {
      return "No menu items are available for the upcoming week yet.";
    }

    const uniqueDates = [...new Set(menuItems.map(item => item.date))].sort();
    let response = "Here's the menu for the upcoming days:\n\n";

    uniqueDates.forEach(date => {
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      response += `📅 ${dayName}:\n`;

      const dayItems = menuItems.filter(item => item.date === date);
      const mealOrder = { breakfast: 1, lunch: 2, evening_snacks: 3, dinner: 4 };
      const sortedItems = dayItems.sort((a, b) => mealOrder[a.meal_type] - mealOrder[b.meal_type]);

      sortedItems.forEach(item => {
        response += `  • ${formatMenuItem(item)}\n`;
      });
      response += '\n';
    });

    return response;
  };

  const submitFeedback = async (feedbackText: string) => {
    // Extract title and description from feedback text
    const sentences = feedbackText.match(/[^.!?]+[.!?]+/g);
    let title: string;
    let description: string;

    if (sentences && sentences.length > 1) {
      title = sentences[0].trim();
      description = sentences.slice(1).join(' ').trim();
    } else if (feedbackText.length > 50) {
      title = feedbackText.substring(0, 50).trim() + '...';
      description = feedbackText;
    } else {
      title = feedbackText;
      description = feedbackText;
    }

    const complaintData: {
      title: string;
      description: string;
      category: string;
      status: string;
      user_id?: string;
    } = {
      title,
      description,
      category: 'Food Quality',
      status: 'Pending',
    };

    if (user) {
      complaintData.user_id = user.id;
    }

    const { error } = await supabase.from('complaints').insert(complaintData);

    if (error) {
      console.error('Error submitting complaint:', error);
      return "Sorry, there was an error submitting your feedback. Please try again.";
    }

    window.dispatchEvent(new CustomEvent('complaint-submitted'));

    return "Thank you for your feedback! We've received it and will review it soon. You can track its progress in the Complaints tab.";
  };

  const processUserInput = async (userInput: string) => {
    const input = userInput.toLowerCase().trim();

    if (input.includes('feedback') || input.includes('complaint') || input.includes('issue')) {
      return "I'd be happy to help you submit feedback. Please describe your feedback or complaint, and I'll submit it for you. Start your message with 'Submit:' followed by your feedback.\n\nFor example: 'Submit: The food was cold today'";
    }

    if (input.startsWith('submit:')) {
      const feedbackText = userInput.slice(7).trim();
      if (!feedbackText) {
        return "Please provide your feedback after 'Submit:'";
      }
      return await submitFeedback(feedbackText);
    }

    if (input.includes('today') && input.includes('menu')) {
      return getTodayMenu();
    }

    if (input.includes('breakfast')) {
      return getMealInfo('breakfast');
    }

    if (input.includes('lunch')) {
      return getMealInfo('lunch');
    }

    if (input.includes('evening') || input.includes('snacks')) {
      return getMealInfo('evening_snacks');
    }

    if (input.includes('dinner')) {
      return getMealInfo('dinner');
    }

    if (input.includes('week') || input.includes('upcoming') || input.includes('next')) {
      return getWeekMenu();
    }

    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! How can I help you today? You can ask about today's menu, specific meals, or submit feedback.";
    }

    if (input.includes('help')) {
      return "I can help you with:\n\n• Today's menu - Just ask 'What's today's menu?'\n• Specific meals - Ask about breakfast, lunch, evening snacks, or dinner\n• Weekly menu - Ask 'Show me this week's menu'\n• Submit feedback - Say 'I want to give feedback' or start with 'Submit: your feedback'\n\nWhat would you like to know?";
    }

    return "I'm not sure I understood that. Try asking about:\n• Today's menu\n• A specific meal (breakfast, lunch, evening snacks, dinner)\n• This week's menu\n• Submitting feedback\n\nOr type 'help' to see what I can do!";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userInput = input.trim();
    setInput('');
    addUserMessage(userInput);
    setIsTyping(true);

    setTimeout(async () => {
      const response = await processUserInput(userInput);
      setIsTyping(false);
      addBotMessage(response);
    }, 500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
      <div className="bg-navy-900 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
        <Bot className="w-6 h-6" />
        <div>
          <h3 className="font-semibold">Mess Menu Assistant</h3>
          <p className="text-sm text-gray-300">Ask me anything about the menu</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-navy-900" />
              </div>
            )}

            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                message.sender === 'user'
                  ? 'bg-navy-900 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-navy-900" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-navy-900 text-white p-2 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
