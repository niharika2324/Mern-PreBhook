import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarCheck,
  ChevronRight,
  Clock,
  MapPin,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Utensils,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { apiUrl, assetUrl } from "../config/api.js";

const TIME_SLOTS = [
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM",
];

const emptyDraft = {
  active: false,
  step: "restaurant",
  restaurant: null,
  date: "",
  time: "",
  guests: "",
  phone: "",
};

const getRestaurantImage = (restaurant) => {
  if (restaurant?.image) return assetUrl(restaurant.image);
  return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=70&fit=crop";
};

const todayISO = () => new Date().toISOString().split("T")[0];

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const normalize = (value = "") => value.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

const parseDate = (text) => {
  const q = text.toLowerCase();
  if (q.includes("tomorrow")) return tomorrowISO();
  if (q.includes("today")) return todayISO();
  const iso = q.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const slash = q.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (slash) {
    const [, d, m, y] = slash;
    const year = y ? (y.length === 2 ? `20${y}` : y) : new Date().getFullYear();
    return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
};

const parseGuests = (text) => {
  const match = text.match(/\b([1-9]|10)\b/);
  return match ? match[1] : "";
};

const parsePhone = (text) => {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
};

const parseTime = (text) => {
  const q = text.toLowerCase().replace(/\./g, "");
  const exact = TIME_SLOTS.find(slot => q.includes(slot.toLowerCase()));
  if (exact) return exact;

  const match = q.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = match[2] || "00";
  const meridiem = match[3] || (hour >= 7 && hour <= 10 ? "PM" : hour >= 12 ? "PM" : "PM");
  if (hour > 12) hour -= 12;
  const candidate = `${hour}:${minute.padStart(2, "0")} ${meridiem.toUpperCase()}`;
  return TIME_SLOTS.includes(candidate) ? candidate : "";
};

const findRestaurant = (text, restaurants) => {
  const q = normalize(text);
  const byIndex = q.match(/\b(?:number|option)?\s*([1-9])\b/);
  if (byIndex) {
    const found = restaurants[Number(byIndex[1]) - 1];
    if (found) return found;
  }
  return restaurants.find(r => q.includes(normalize(r.name))) ||
    restaurants.find(r => normalize(r.name).includes(q));
};

const getPageContext = (pathname) => {
  if (pathname.includes("/owner")) return "owner";
  if (pathname.includes("/admin")) return "admin";
  if (pathname.includes("/restaurant/")) return "restaurant";
  if (pathname.includes("/book/")) return "booking";
  if (pathname.includes("/user/bookings")) return "bookings";
  if (pathname.includes("/restaurants")) return "restaurants";
  return "user";
};

const rolePrompts = (role, page) => {
  if (role === "owner") {
    return ["How do I add a dish?", "How do table layouts work?", "Reservation tips"];
  }
  if (role === "admin") {
    return ["Explain approvals", "Platform summary", "Review restaurants"];
  }
  if (page === "restaurant") {
    return ["Book this type of place", "Show booking tips", "How does preorder work?"];
  }
  if (page === "bookings") {
    return ["Explain my bookings", "Book another table", "How preorder works"];
  }
  return ["Recommend dinner", "Book a table", "How does preorder work?"];
};

const buildResponse = (input, { restaurants, currentUser, page }) => {
  const q = input.toLowerCase().trim();
  const cuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];
  const topRestaurants = restaurants.slice(0, 3);

  if (/^(hi|hello|hey|good\s*(morning|evening|afternoon))/.test(q)) {
    const name = currentUser?.name?.split(" ")[0];
    return {
      text: `Hello${name ? `, ${name}` : ""}. I am your AI Dining Concierge.\n\nI can recommend restaurants, guide pre-orders, explain your dashboard, or book a table for you right here.`,
      quickReplies: rolePrompts(currentUser?.role, page),
      cards: topRestaurants,
    };
  }

  if (/book|reserv|table|seat/.test(q)) {
    return {
      text: restaurants.length
        ? "Absolutely. I can collect the reservation details here, then send you to the paid booking flow. The table is confirmed only after Razorpay payment succeeds. Choose a restaurant below or type the restaurant name."
        : "I can help book a table once restaurants are available. I could not find active restaurants right now.",
      quickReplies: topRestaurants.map((r, i) => `${i + 1}. ${r.name}`),
      cards: topRestaurants,
      startBooking: true,
    };
  }

  if (/menu|food|dish|eat|cuisine|recommend|suggest|order|dinner|lunch/.test(q)) {
    const matchedCuisine = cuisines.find(c => q.includes(c.toLowerCase()));
    const picks = matchedCuisine
      ? restaurants.filter(r => r.cuisine?.toLowerCase().includes(matchedCuisine.toLowerCase())).slice(0, 3)
      : topRestaurants;
    return {
      text: picks.length
        ? `Here are a few strong picks${matchedCuisine ? ` for ${matchedCuisine}` : ""}. You can open a restaurant, book a table, or ask me to book one for you.`
        : "I do not see matching restaurants yet, but you can browse all available options.",
      actions: [{ label: "Browse Restaurants", path: "/restaurants" }],
      quickReplies: cuisines.slice(0, 4).map(c => `I want ${c}`),
      cards: picks,
    };
  }

  if (/pre.?order|preorder|advance order/.test(q)) {
    return {
      text: "Pre-order works after a booking: reserve a table, choose dishes, and your order is prepared ahead of arrival. It is best for business lunches, date nights, and groups.",
      actions: [{ label: "Start Booking", intent: "booking" }, { label: "Browse Restaurants", path: "/restaurants" }],
    };
  }

  if (/my booking|my order|my reserv|history|past/.test(q)) {
    return {
      text: "Your bookings page shows table reservations and food orders together, including restaurant, date, time, guests, and attached pre-orders.",
      actions: [{ label: "View My Bookings", path: "/user/bookings" }],
    };
  }

  if (/owner|add restaurant|add dish|menu item|table layout|partner/.test(q)) {
    return {
      text: "For owners, the dashboard lets you manage restaurant profiles, menu items, table configuration, and reservations. Start from the tabs in the owner portal.",
      actions: [{ label: "Owner Dashboard", path: "/owner/dashboard" }],
      quickReplies: ["How do I add a dish?", "How do I add tables?", "Reservation tips"],
    };
  }

  if (/admin|approval|approve|platform/.test(q)) {
    return {
      text: "The admin area is designed for platform oversight: users, restaurants, approvals, bookings, and order records.",
      actions: [{ label: "Admin Dashboard", path: "/admin/dashboard" }],
    };
  }

  if (/hour|open|close|timing|time|when/.test(q)) {
    return {
      text: "Reservations usually run from 12:00 PM to 10:00 PM. Peak dinner hours are 7:00 PM to 9:30 PM, so earlier booking is recommended.",
      quickReplies: ["Book for 7:30 PM", "Book tomorrow", "Show restaurants"],
    };
  }

  if (/cancel|refund|policy|change/.test(q)) {
    return {
      text: "You can manage reservations from My Bookings. Table booking changes depend on restaurant availability; pre-order/payment policies are handled by the restaurant and payment flow.",
      actions: [{ label: "My Bookings", path: "/user/bookings" }],
    };
  }

  if (/voice|speak|microphone|mic/.test(q)) {
    return {
      text: "Voice mode is available in supported browsers. Use the microphone button to speak, and the speaker button to let me read replies aloud.",
    };
  }

  if (/help|support|how|guide|what can/.test(q)) {
    return {
      text: "I can recommend restaurants, book a table by collecting details, explain pre-ordering, guide owners through dashboard tasks, and help you navigate your bookings.",
      quickReplies: rolePrompts(currentUser?.role, page),
      cards: topRestaurants,
    };
  }

  if (/thank|thanks|great|awesome|perfect/.test(q)) {
    return { text: "You are welcome. I am here whenever you want to plan the next table." };
  }

  return {
    text: `I can help with dining, booking, menus, pre-orders, and dashboard guidance. Try one of these:`,
    quickReplies: rolePrompts(currentUser?.role, page),
  };
};

const TypingDots = () => (
  <div className="flex items-center gap-1 py-2 px-1">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full"
        style={{ background: "#2C7A5C" }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.15, repeat: Infinity, delay: i * 0.18 }}
      />
    ))}
  </div>
);

const formatText = (text) => (
  text.split("\n").map((line, i) => {
    const chunks = line.split(/(\*\*.+?\*\*)/g);
    return (
      <p key={i} className={`text-sm leading-relaxed ${i > 0 && line.trim() ? "mt-1" : ""}`}>
        {chunks.map((chunk, idx) => (
          chunk.startsWith("**") && chunk.endsWith("**")
            ? <strong key={idx} className="text-white font-semibold">{chunk.slice(2, -2)}</strong>
            : <React.Fragment key={idx}>{chunk || (line ? "" : "\u00a0")}</React.Fragment>
        ))}
      </p>
    );
  })
);

const RestaurantCards = ({ cards = [], onBook, onOpen }) => {
  if (!cards.length) return null;
  return (
    <div className="space-y-2 w-full">
      {cards.map((restaurant, index) => (
        <motion.div
          key={restaurant._id || restaurant.id || restaurant.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex gap-3 p-3">
            <img
              src={getRestaurantImage(restaurant)}
              alt={restaurant.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=60&fit=crop"; }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{index + 1}. {restaurant.name}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "#8B9CB5" }}>{restaurant.cuisine || "Multi Cuisine"}</p>
              <p className="text-xs mt-1 flex items-center gap-1 truncate" style={{ color: "#4A5568" }}>
                <MapPin className="w-3 h-3 flex-shrink-0" /> {restaurant.location || "Premium Location"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button onClick={() => onBook(restaurant)} className="py-2 text-xs font-bold" style={{ color: "#2C7A5C" }}>Book</button>
            <button onClick={() => onOpen(restaurant)} className="py-2 text-xs font-bold" style={{ color: "#C8A96A" }}>Open</button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const BookingSummary = ({ draft }) => (
  <div className="w-full rounded-2xl p-3 space-y-2" style={{ background: "rgba(44,122,92,0.1)", border: "1px solid rgba(44,122,92,0.22)" }}>
    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2C7A5C" }}>Reservation Draft</p>
    {[
      ["Restaurant", draft.restaurant?.name],
      ["Date", draft.date],
      ["Time", draft.time],
      ["Guests", draft.guests],
      ["Phone", draft.phone],
    ].map(([label, value]) => (
      <div key={label} className="flex justify-between gap-3 text-xs">
        <span style={{ color: "#8B9CB5" }}>{label}</span>
        <span className="text-white font-semibold text-right">{value || "Pending"}</span>
      </div>
    ))}
  </div>
);

const AIConcierge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pulsing, setPulsing] = useState(true);
  const [bookingDraft, setBookingDraft] = useState(emptyDraft);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const page = getPageContext(location.pathname);
  const isAuthPage = location.pathname === "/" || location.pathname === "/register";
  const supportsSpeech = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const supportsVoiceOut = typeof window !== "undefined" && "speechSynthesis" in window;

  const contextPrompts = useMemo(
    () => rolePrompts(currentUser?.role, page),
    [currentUser?.role, page]
  );

  useEffect(() => {
    try { setCurrentUser(JSON.parse(localStorage.getItem("currentUser") || "null")); } catch {}
    axios.get(apiUrl("/api/users/approved-restaurants"))
      .then(r => setRestaurants(r.data?.data || []))
      .catch(() => {
        setRestaurants([]);
        if (open) toast.error("Concierge could not refresh restaurants.");
      });
  }, [location, open]);

  useEffect(() => {
    if (!supportsSpeech || recognitionRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) send(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      toast.error("Voice input was interrupted.");
    };
    recognitionRef.current = recognition;
  }, [supportsSpeech]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const name = currentUser?.name?.split(" ")[0];
      pushAI({
        text: `Hello${name ? `, ${name}` : ""}. I am your AI Dining Concierge.\n\nI can recommend restaurants, prepare a paid table booking, answer owner/admin questions, and use voice in supported browsers.`,
        actions: [
          { label: "Book with AI", intent: "booking" },
          { label: "Find Restaurants", path: "/restaurants" },
          { label: "My Bookings", path: "/user/bookings" },
        ],
        quickReplies: contextPrompts,
        cards: restaurants.slice(0, 2),
      });
    }
  }, [open, currentUser, messages.length, contextPrompts, restaurants]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 250);
      setPulsing(false);
    }
  }, [open]);

  const speak = (text) => {
    if (!voiceEnabled || !supportsVoiceOut) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, "").slice(0, 280));
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const pushAI = (message) => {
    setMessages(prev => [...prev, { role: "ai", ...message }]);
    if (message.text) speak(message.text);
  };

  const beginBooking = (restaurant = null) => {
    const next = { ...emptyDraft, active: true, restaurant, step: restaurant ? "date" : "restaurant" };
    setBookingDraft(next);
    pushAI({
      text: restaurant
        ? `Lovely choice: **${restaurant.name}**.\nI will collect details, then take you to the paid booking flow. What date should I prepare? You can say "today", "tomorrow", or type YYYY-MM-DD.`
        : "I can prepare that for you. Which restaurant should I reserve? You can type the name or choose one below.",
      quickReplies: restaurant ? ["Today", "Tomorrow"] : restaurants.slice(0, 4).map((r, i) => `${i + 1}. ${r.name}`),
      cards: restaurant ? [] : restaurants.slice(0, 3),
      bookingSummary: next,
    });
  };

  const askNextBookingQuestion = (draft) => {
    const prompts = {
      date: {
        text: `Great. What date should I book **${draft.restaurant?.name}** for?`,
        quickReplies: ["Today", "Tomorrow"],
      },
      time: {
        text: "What time should I reserve?",
        quickReplies: ["7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"],
      },
      guests: {
        text: "For how many guests?",
        quickReplies: ["2", "3", "4", "6"],
      },
      phone: {
        text: "What phone number should receive the confirmation?",
      },
      confirm: {
        text: "Please confirm the reservation details. Reply **yes** and I will take you to the paid booking flow. Your booking is created only after Razorpay payment succeeds.",
        quickReplies: ["Yes, continue to payment", "Cancel"],
      },
    };
    pushAI({ ...prompts[draft.step], bookingSummary: draft });
  };

  const handleBookingInput = async (text) => {
    const q = text.toLowerCase();
    if (/cancel|stop|never mind|nevermind/.test(q)) {
      setBookingDraft(emptyDraft);
      pushAI({ text: "No problem. I cancelled the concierge booking draft.", quickReplies: contextPrompts });
      return true;
    }

    let draft = { ...bookingDraft };
    if (draft.step === "restaurant") {
      const restaurant = findRestaurant(text, restaurants);
      if (!restaurant) {
        pushAI({
          text: "I could not match that restaurant. Please choose one of these or type the restaurant name.",
          cards: restaurants.slice(0, 3),
          quickReplies: restaurants.slice(0, 4).map((r, i) => `${i + 1}. ${r.name}`),
          bookingSummary: draft,
        });
        return true;
      }
      draft = { ...draft, restaurant, step: "date" };
    } else if (draft.step === "date") {
      const date = parseDate(text);
      if (!date) {
        pushAI({ text: "Please share the date as today, tomorrow, or YYYY-MM-DD.", quickReplies: ["Today", "Tomorrow"], bookingSummary: draft });
        return true;
      }
      draft = { ...draft, date, step: "time" };
    } else if (draft.step === "time") {
      const time = parseTime(text);
      if (!time) {
        pushAI({ text: "Please choose one of the available reservation time slots.", quickReplies: ["7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"], bookingSummary: draft });
        return true;
      }
      draft = { ...draft, time, step: "guests" };
    } else if (draft.step === "guests") {
      const guests = parseGuests(text);
      if (!guests) {
        pushAI({ text: "Please enter a guest count from 1 to 10.", quickReplies: ["2", "3", "4", "6"], bookingSummary: draft });
        return true;
      }
      draft = { ...draft, guests, step: "phone" };
    } else if (draft.step === "phone") {
      const phone = parsePhone(text);
      if (!phone) {
        pushAI({ text: "Please enter a valid 10 digit phone number for confirmation.", bookingSummary: draft });
        return true;
      }
      draft = { ...draft, phone, step: "confirm" };
    } else if (draft.step === "confirm") {
      if (!/yes|confirm|book|sure|done/.test(q)) {
        pushAI({ text: "Reply **yes** to continue to the paid booking flow, or **cancel** to stop.", quickReplies: ["Yes, continue to payment", "Cancel"], bookingSummary: draft });
        return true;
      }
      handoffToPaidBooking(draft);
      return true;
    }

    setBookingDraft(draft);
    askNextBookingQuestion(draft);
    return true;
  };

  const handoffToPaidBooking = (draft) => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) {
      pushAI({ text: "Please sign in before continuing to payment.", actions: [{ label: "Sign In", path: "/" }] });
      return;
    }
    toast.success("Details prepared. Continue with payment to confirm.");
    setBookingDraft(emptyDraft);
    const paymentState = {
      aiBookingDraft: {
        date: draft.date,
        time: draft.time,
        guests: draft.guests,
        phone: draft.phone,
        restaurantName: draft.restaurant.name,
        startAtPayment: true,
      },
    };
    pushAI({
      text: `I prepared your reservation for **${draft.restaurant.name}**.\n\nRedirecting you to payment now. Review the prefilled table details and complete Razorpay payment. The table is **not booked** until payment succeeds.`,
      actions: [
        {
          label: "Continue to Payment",
          path: `/restaurant/${draft.restaurant._id}`,
          state: paymentState,
        },
      ],
      bookingSummary: draft,
    });
    window.setTimeout(() => {
      navigate(`/restaurant/${draft.restaurant._id}`, { state: paymentState });
      setOpen(false);
    }, 900);
  };

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || typing) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setTyping(true);
    await new Promise(resolve => setTimeout(resolve, 320 + Math.random() * 420));
    setTyping(false);

    if (bookingDraft.active) {
      await handleBookingInput(trimmed);
      return;
    }

    const response = buildResponse(trimmed, { restaurants, currentUser, page });
    if (response.startBooking) {
      pushAI(response);
      setTimeout(() => beginBooking(), 120);
      return;
    }
    pushAI(response);
  };

  const handleAction = (action) => {
    if (action.intent === "booking") {
      beginBooking();
      return;
    }
    if (action.path) {
      navigate(action.path, action.state ? { state: action.state } : undefined);
      setOpen(false);
    }
  };

  const startListening = () => {
    if (!supportsSpeech || !recognitionRef.current) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    try {
      setOpen(true);
      setListening(true);
      recognitionRef.current.start();
    } catch {
      setListening(false);
    }
  };

  if (isAuthPage) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {!open && pulsing && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg"
              style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              AI Concierge
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(openState => !openState)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl relative"
          style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 8px 32px -4px rgba(44,122,92,0.6)" }}
          aria-label="Open AI Concierge"
        >
          {pulsing && !open && <span className="absolute inset-0 rounded-2xl animate-ping" style={{ background: "rgba(44,122,92,0.3)" }} />}
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Bot className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[390px] max-w-[calc(100vw-24px)] flex flex-col rounded-[24px] overflow-hidden shadow-2xl"
            style={{
              background: "#0A0D14",
              border: "1px solid rgba(255,255,255,0.08)",
              maxHeight: "580px",
              boxShadow: "0 30px 80px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(44,122,92,0.15), rgba(8,12,18,0))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 12px rgba(44,122,92,0.4)" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">AI Dining Concierge</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <p className="text-xs" style={{ color: "#10B981" }}>
                    Online - {supportsSpeech ? "Voice ready" : "Text mode"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVoiceEnabled(value => !value)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: voiceEnabled ? "rgba(44,122,92,0.16)" : "rgba(255,255,255,0.04)", color: voiceEnabled ? "#2C7A5C" : "#8B9CB5" }}
                aria-label="Toggle spoken replies"
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setMessages([]); setBookingDraft(emptyDraft); }}
                className="text-xs font-medium transition-colors"
                style={{ color: "#4A5568" }}
              >
                Clear
              </button>
            </div>

            <div className="px-4 pt-3 flex flex-wrap gap-2">
              {contextPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B9CB5" }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                >
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(44,122,92,0.2)", border: "1px solid rgba(44,122,92,0.3)" }}>
                      <Bot className="w-4 h-4" style={{ color: "#2C7A5C" }} />
                    </div>
                  )}
                  <div className={`max-w-[84%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-3 rounded-2xl ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={{
                        background: msg.role === "user" ? "linear-gradient(135deg, #2C7A5C, #3A9970)" : "rgba(255,255,255,0.04)",
                        border: msg.role === "ai" ? "1px solid rgba(255,255,255,0.06)" : "none",
                        color: "#F1F5F9",
                      }}>
                      {msg.role === "ai" ? formatText(msg.text) : <p className="text-sm text-white">{msg.text}</p>}
                    </div>

                    {msg.bookingSummary && <BookingSummary draft={msg.bookingSummary} />}
                    {msg.cards?.length > 0 && (
                      <RestaurantCards
                        cards={msg.cards}
                        onBook={beginBooking}
                        onOpen={(restaurant) => {
                          navigate(`/restaurant/${restaurant._id || restaurant.id}`);
                          setOpen(false);
                        }}
                      />
                    )}

                    {msg.actions?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.actions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleAction(action)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)", color: "#2C7A5C" }}
                          >
                            {action.label} <ChevronRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.quickReplies?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.quickReplies.map((reply, i) => (
                          <button
                            key={i}
                            onClick={() => send(reply)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8B9CB5" }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(44,122,92,0.2)", border: "1px solid rgba(44,122,92,0.3)" }}>
                    <Bot className="w-4 h-4" style={{ color: "#2C7A5C" }} />
                  </div>
                  <div className="px-4 py-2 rounded-2xl rounded-tl-sm"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {bookingDraft.active && (
              <div className="px-4 pb-3">
                <BookingSummary draft={bookingDraft} />
              </div>
            )}

            <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex gap-2 items-center">
                <button
                  onClick={startListening}
                  disabled={listening}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
                  style={{ background: listening ? "rgba(239,68,68,0.16)" : "rgba(255,255,255,0.06)", color: listening ? "#F87171" : "#8B9CB5" }}
                  aria-label="Start voice input"
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={bookingDraft.active ? "Reply with the next booking detail..." : "Ask me anything about dining..."}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }}
                  onFocus={e => e.target.style.borderColor = "rgba(44,122,92,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <motion.button
                  onClick={() => send()}
                  disabled={!input.trim() || typing}
                  whileHover={input.trim() ? { scale: 1.05 } : {}}
                  whileTap={input.trim() ? { scale: 0.95 } : {}}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
                  style={{ background: input.trim() ? "linear-gradient(135deg, #2C7A5C, #3A9970)" : "rgba(255,255,255,0.06)" }}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 text-white" />
                </motion.button>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs" style={{ color: "#4A5568" }}>
                <span className="inline-flex items-center gap-1"><Utensils className="w-3 h-3" /> Concierge</span>
                <span className="inline-flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> AI booking</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Enter to send</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIConcierge;
