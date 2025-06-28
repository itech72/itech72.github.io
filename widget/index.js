(function () {
  "use strict";

  // Prevent multiple instances
  if (window.ChatbotWidget) { 
    return;
  }

  // Configuration - can be overridden by embedding website
  const defaultConfig = {
    chatbotId: "6817b3f1b21896674e7fc212", // Must be provided by embedding website
    apiUrl: "http://127.0.0.1:8000/api/v1",
    accessToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2ZhNGVmMzJkYjJlZTJlNWUzYWJiMmYiLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUxMTQ2ODQ3fQ.iECRGGUYZi0ICrUG4MsGuSfB3L2UmCVlxuklKZdRNSE",
    position: "bottom-right", // bottom-right, bottom-left
    primaryColor: "#343E4C",
    secondaryColor: "#ffffff",
    textColor: "#1F2937",
    backgroundColor: "#f3f3f3",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    name: "Chat Assistant",
    welcomeMessage: "Hi! I'm here to help you. How can I assist you today?",
    avatarUrl: null,
    chatBubbleStyle: "rounded", // rounded, sharp, bubble
    predefinedQuestions: [],
    // Lead capture configuration
    leadCapture: {
      enabled: false,
      fields: {
        name: false,
        email: false,
        phone: false,
        company: false,
      },
      salesforceUrl: null,
      message: "We just need a few details before we start chatting.",
    },
  };

  class ChatbotWidget {
    constructor(userConfig = {}) {
      this.config = { ...defaultConfig, ...userConfig };
      this.isOpen = false;
      this.messages = [];
      this.isTyping = false;
      this.isConnected = false;
      this.conversationId = null;
      this.leadData = {};
      this.leadFormComplete = false;

      this.init();
    }

    init() {
      this.createWidget();
      this.attachEventListeners();

      if (this.config.chatbotId) {
        this.startConversation();
      } else {
        console.error("ChatbotWidget: chatbotId is required");
      }
    }

    async startConversation() {
      try {
        const response = await this.apiCall(
          "POST",
          `/chatbot-conversation/chat/${this.config.chatbotId}`
        );
        this.conversationId = response.data._id;
        console.log("conversation id: ", this.conversationId);
        this.isConnected = true;
        this.updateConnectionStatus();

        // Add welcome message after connection
        this.addWelcomeMessage();
      } catch (error) {
        console.error("Failed to start conversation:", error);
        this.isConnected = false;
        this.updateConnectionStatus();
        this.addWelcomeMessage(); // Still show welcome message even if offline
      }
    }

    async apiCall(method, endpoint, data = null) {
      const url = `${this.config.apiUrl}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        ...(this.config.accessToken && {
          Authorization: `Bearer ${this.config.accessToken}`,
        }),
      };
      const options = { method, headers };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      return await response.json();
    }

    createWidget() {
      // Create main container
      this.container = document.createElement("div");
      this.container.id = "chatbot-widget";

      // Check if lead capture is needed
      if (this.shouldShowLeadForm()) {
        this.container.innerHTML = this.getLeadFormHTML();
      } else {
        this.container.innerHTML = this.getWidgetHTML();
      }

      // Add styles
      this.addStyles();

      // Append to body
      document.body.appendChild(this.container);

      // Get references to elements
      this.setupElementReferences();
    }

    shouldShowLeadForm() {
      return (
        this.config.leadCapture.enabled &&
        !this.leadFormComplete &&
        Object.values(this.config.leadCapture.fields).some(
          (required) => required
        )
      );
    }

    setupElementReferences() {
      this.chatBubble = this.container.querySelector(".chatbot-bubble");
      this.chatWindow = this.container.querySelector(".chatbot-window");
      this.messagesContainer =
        this.container.querySelector(".chatbot-messages");
      this.messageInput = this.container.querySelector(".chatbot-input");
      this.sendButton = this.container.querySelector(".chatbot-send");
      this.closeButton = this.container.querySelector(".chatbot-close");
      this.connectionStatus = this.container.querySelector(".chatbot-status");
      this.statusDot = this.container.querySelector(".chatbot-status-dot");
    }

    getLeadFormHTML() {
      const requiredFields = Object.entries(this.config.leadCapture.fields)
        .filter(([_, required]) => required)
        .map(([field]) => field);

      const fieldsHTML = requiredFields
        .map(
          (field) => `
        <div class="lead-field">
          <label class="lead-label">${this.capitalizeFirst(field)}</label>
          <input type="${field === "email" ? "email" : "text"}" 
                 class="lead-input" 
                 data-field="${field}"
                 placeholder="Enter your ${field}" 
                 required>
        </div>
      `
        )
        .join("");

      return `
        <div class="chatbot-bubble">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        
        <div class="chatbot-window lead-form">
          <div class="chatbot-header">
            <div class="chatbot-header-content">
              <div class="chatbot-name">${this.config.name}</div>
            </div>
            <button class="chatbot-close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          ${
            this.config.leadCapture.message
              ? `
            <div class="lead-message">
              <p>${this.config.leadCapture.message}</p>
            </div>
          `
              : ""
          }
          
          <div class="lead-form-content">
            ${fieldsHTML}
          </div>
          
          <div class="lead-form-footer">
            <button class="lead-submit-btn" disabled>Continue to Chat</button>
          </div>
        </div>
      `;
    }

    getWidgetHTML() {
      return `
        <div class="chatbot-bubble">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        </div>
        <div class="chatbot-window">
          <div class="chatbot-header">
            <button class="chatbot-menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            
            <div class="chatbot-header-center">
              <div class="chatbot-info">
                <div class="chatbot-name-container">
                  <span class="chatbot-name">${this.config.name}</span>
                  <div class="chatbot-status-dot"></div>
                </div>
              </div>
            </div>
            
            <button class="chatbot-close">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="chatbot-content">
            <div class="chatbot-messages"></div>
            <div class="chatbot-input-container">
              <button class="chatbot-image-btn" title="Send Image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              </button>
              <button class="chatbot-audio-btn" title="Record Audio">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <input type="file" accept="image/*" class="chatbot-image-input" style="display:none" />
              <input type="text" class="chatbot-input" placeholder="Type your message..." maxlength="500">
              <button class="chatbot-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    addStyles() {
      const bubbleStyle =
        this.config.chatBubbleStyle === "sharp"
          ? "12px"
          : this.config.chatBubbleStyle === "bubble"
          ? "32px"
          : "20px";

      const primary = this.config.primaryColor;
      const secondary = this.config.secondaryColor;
      const text = this.config.textColor;
      const background = this.config.backgroundColor;

      const styles = `
        #chatbot-widget {
          position: fixed;
          ${
            this.config.position.includes("right")
              ? "right: 24px;"
              : "left: 24px;"
          }
          bottom: 24px;
          z-index: 10000;
          font-family: ${this.config.fontFamily};
        }

        .chatbot-bubble {
          width: 60px;
          height: 60px;
          background: ${primary};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 6px 24px ${primary}40, 0 1.5px 4px ${secondary}1A;
          transition: all 0.3s cubic-bezier(.4,2,.6,1);
          color: white;
        }

        .chatbot-bubble:hover {
          transform: scale(1.08) rotate(-3deg);
          box-shadow: 0 10px 32px ${primary}59, 0 2px 8px ${secondary}26;
        }

        .chatbot-bubble svg {
          filter: drop-shadow(0 1px 8px rgba(0,0,0,0.30));
          display: block;
        }

        .chatbot-window {
          position: absolute;
          bottom: 84px;
          right: 0;
          width: 390px;
          height: 570px;
          display: flex;
          flex-direction: column;
          background: ${background};
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
          backdrop-filter: blur(6px);
          transform: scale(0) translateY(20px);
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .chatbot-window.open {
          transform: scale(1) translateY(0);
          opacity: 1;
        }

        .chatbot-window.collapsed {
          height: 76px !important;
          transition: height 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .chatbot-header {
          background: ${primary};
          flex-shrink: 0;
          color: white;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          height: 68px;
          box-sizing: border-box;
        }

        .chatbot-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          pointer-events: none;
        }

        .chatbot-header-center {
          display: flex;
          align-items: center;
          gap: 12px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
        }

        .chatbot-menu, .chatbot-close {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          cursor: pointer;
          padding: 10px;
          border-radius: 10px;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          position: relative;
        }

        .chatbot-menu:hover, .chatbot-close:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .chatbot-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .chatbot-avatar svg {
          color: rgba(255, 255, 255, 0.9);
        }

        .chatbot-avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .chatbot-name-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chatbot-name {
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.01em;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .chatbot-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
          animation: pulse-green 2s infinite;
        }

        .chatbot-status-dot.disconnected {
          background: #EF4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
          animation: pulse-red 2s infinite;
        }

        @keyframes pulse-green {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        @keyframes pulse-red {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .chatbot-controls {
          display: flex;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .chatbot-toggle, .chatbot-close {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chatbot-toggle:hover, .chatbot-close:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .chatbot-toggle svg, .chatbot-close svg {
          display: block;
        }

        .chatbot-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .chatbot-messages {
          flex: 1;
          padding: 20px 18px 12px 18px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .chatbot-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chatbot-messages::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 2px;
        }

        .chatbot-message {
          max-width: 90%;
          word-wrap: break-word;
          animation: messageSlide 0.3s ease;
          font-size: 15px;
          line-height: 1.6;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chatbot-message.bot {
          align-self: flex-start;
          flex-direction: row;
        }
        .chatbot-message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .chatbot-message-content {
          background: ${secondary};
          color: ${text};
          padding: 13px 18px;
          border-radius: 18px 18px 18px 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          flex: 1;
        }
        .chatbot-message.user .chatbot-message-content {
          background: ${primary};
          color: white;
          border-radius: 18px 18px 6px 18px;
          box-shadow: 0 2px 8px ${primary}30;
        }
        .chatbot-message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${primary};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .chatbot-message-avatar svg {
          width: 18px;
          height: 18px;
          color: white;
        }
        .chatbot-typing {
          align-self: flex-start;
          background: #e0e7ef;
          padding: 13px 18px;
          border-radius: 18px 18px 18px 18px;
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .chatbot-typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #9CA3AF;
          animation: typingDot 1.4s infinite ease-in-out;
        }
        .chatbot-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .chatbot-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingDot {
          0%, 60%, 100% { transform: scale(0.8); opacity: 0.5; }
          30% { transform: scale(1); opacity: 1; }
        }
        .chatbot-input-container {
          flex-shrink: 0;
          padding: 14px 16px;
          background: #fff;
          display: flex;
          gap: 8px;
          align-items: center;
          border-top: 1px solid #f1f1f1;
        }
        .chatbot-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e5e5e5;
          border-radius: 24px;
          outline: none;
          font-size: 15px;
          background: #fafafa;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-right: 4px;
        }
        .chatbot-input:focus {
          border-color: ${primary};
          box-shadow: 0 0 0 2px ${primary}33;
        }
        .chatbot-image-btn,
        .chatbot-audio-btn {
          background: ${background};
          border: 1px solid #E5E7EB;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .chatbot-image-btn:hover,
        .chatbot-audio-btn:hover {
          background: #f3f4f6;
          transform: scale(1.05);
          border-color: ${primary};
        }
        .chatbot-image-btn svg,
        .chatbot-audio-btn svg {
          color: ${primary};
          display: block;
        }
        .chatbot-send {
          width: 44px;
          height: 44px;
          background: ${primary};
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px ${primary}40;
        }
        .chatbot-send svg {
          display: block;
        }
        .chatbot-send:hover {
          background: ${secondary};
        }
        .chatbot-send:disabled {
          background: #c1c1c1;
          cursor: not-allowed;
          transform: none;
        }
        .product-card {
          background: linear-gradient(135deg, ${background}F2 80%, #e0e7ef 100%);
          border-radius: 20px;
          box-shadow: 0 4px 16px ${secondary}1A, 0 1.5px 4px ${primary}14;
          margin: 16px 0;
          transition: transform 0.2s, box-shadow 0.2s;
          display: grid;
          grid-template-rows: auto 1fr;
        }
        .product-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 8px 32px ${secondary}21, 0 4px 12px ${primary}1A;
        }
        .product-image {
          width: 100%;
          height: 220px;
          object-fit: cover;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 2px 8px ${secondary}14;
        }
        .product-info {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .product-name {
          font-size: 18px;
          font-weight: 700;
          color: ${text};
        }
        .product-price {
          font-size: 19px;
          font-weight: 800;
          color: ${secondary};
        }
        .product-description {
          font-size: 15px;
          color: #4B5563;
          line-height: 1.5;
        }
        .product-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          color: #fbbf24;
        }
        .product-availability {
          font-size: 13px;
          color: #10B981;
        }
        .product-link {
          margin-top: 14px;
          padding: 10px 16px;
          align-self: start;
          background: ${secondary};
          color: white;
          border-radius: 10px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 1px 4px ${secondary}14;
        }
        .product-link:hover {
          background: ${primary};
          transform: scale(1.05);
        }
        .product-features {
          margin: 10px 0 0 0;
          padding-left: 18px;
        }
        .product-features li {
          font-size: 14px;
          color: #374151;
          margin-bottom: 2px;
        }
        .product-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          margin-top: 10px;
          margin-left: 42px;
          width: 78%;
        }
        .product-grid-item {
          background: ${background};
          border-radius: 14px;
          border: 1.5px solid #e0e7ef;
          overflow: hidden;
          box-shadow: box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-grid-item:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 4px 16px ${secondary}1A;
        }
        .product-grid-image {
          width: 100%;
          height: 140px;
          object-fit: cover;
          background: #e0e7ef;
        }
        .product-grid-info {
          padding: 10px 12px;
        }
        .product-grid-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-grid-price {
          font-weight: bold;
          font-size: 15px;
          color: ${secondary};
        }
        @media (max-width: 768px) {
          #chatbot-widget {
            right: 10px;
            bottom: 10px;
          }
          .chatbot-window {
            width: calc(100vw - 20px);
            height: calc(100vh - 80px);
            max-width: 370px;
            max-height: 540px;
          }
        }
      `;

      const styleSheet = document.createElement("style");
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    attachEventListeners() {
      if (this.shouldShowLeadForm()) {
        this.attachLeadFormListeners();
      } else {
        this.attachChatListeners();
      }
    }

    attachLeadFormListeners() {
      this.chatBubble.addEventListener("click", () => this.toggleChat());
      this.closeButton.addEventListener("click", () => this.closeChat());

      // Lead form input validation
      const inputs = this.container.querySelectorAll(".lead-input");
      const submitBtn = this.container.querySelector(".lead-submit-btn");

      inputs.forEach((input) => {
        input.addEventListener("input", (e) => {
          this.leadData[e.target.dataset.field] = e.target.value;
          this.validateLeadForm();
        });
      });

      submitBtn.addEventListener("click", () => this.submitLeadForm());
    }

    attachChatListeners() {
      this.chatBubble.addEventListener("click", () => this.toggleChat());
      this.closeButton.addEventListener("click", () => this.closeChat());
      this.sendButton.addEventListener("click", () => this.sendMessage());

      const imgBtn = this.container.querySelector(".chatbot-image-btn");
      const imgInput = this.container.querySelector(".chatbot-image-input");
      imgBtn.addEventListener("click", () => imgInput.click());
      imgInput.addEventListener("change", (e) => this.handleImageUpload(e));

      const audioBtn = this.container.querySelector(".chatbot-audio-btn");
      audioBtn.addEventListener("click", () => this.toggleRecording());

      this.messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendMessage();
        }
      });

      // Close chat when clicking outside
      document.addEventListener("click", (e) => {
        if (this.isOpen && !this.container.contains(e.target)) {
          this.closeChat();
        }
      });
    }

    validateLeadForm() {
      const requiredFields = Object.entries(this.config.leadCapture.fields)
        .filter(([_, required]) => required)
        .map(([field]) => field);

      const isValid = requiredFields.every(
        (field) => this.leadData[field] && this.leadData[field].trim()
      );

      const submitBtn = this.container.querySelector(".lead-submit-btn");
      submitBtn.disabled = !isValid;
    }

    async submitLeadForm() {
      if (this.config.leadCapture.salesforceUrl) {
        try {
          const payload = {
            lead: {
              ...this.leadData,
              extendedFields: [],
            },
          };

          await fetch(this.config.leadCapture.salesforceUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          console.error("Lead submission failed:", error);
        }
      }

      this.leadFormComplete = true;
      this.container.innerHTML = this.getWidgetHTML();
      this.setupElementReferences();
      this.attachChatListeners();
      this.addWelcomeMessage();
    }

    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }

    openChat() {
      this.isOpen = true;
      this.chatWindow.classList.add("open");
      
      if (this.messageInput) {
        setTimeout(() => this.messageInput.focus(), 100);
      }
    }

    closeChat() {
      this.isOpen = false;
      this.chatWindow.classList.remove("open");
    }

    updateConnectionStatus() {
      if (this.connectionStatus) {
        this.connectionStatus.textContent = this.isConnected
          ? "Online"
          : "Offline";
      }
      
      if (this.statusDot) {
        if (this.isConnected) {
          // Green for connected
          this.statusDot.className = "chatbot-status-dot";
        } else {
          // Red for disconnected
          this.statusDot.className = "chatbot-status-dot disconnected";
        }
      }
    }

    addWelcomeMessage() {
      this.addMessage(this.config.welcomeMessage, "bot");

      // Add predefined questions if available
      if (
        this.config.predefinedQuestions &&
        this.config.predefinedQuestions.length > 0
      ) {
        setTimeout(() => {
          this.addPredefinedQuestions();
        }, 1000);
      }
    }

    addPredefinedQuestions() {
      const questionsContainer = document.createElement("div");
      questionsContainer.className = "predefined-questions";

      this.config.predefinedQuestions.forEach((question) => {
        const questionButton = document.createElement("button");
        questionButton.className = "predefined-question";
        questionButton.textContent = question;
        questionButton.addEventListener("click", () => {
          this.messageInput.value = question;
          this.sendMessage();
        });
        questionsContainer.appendChild(questionButton);
      });
      this.messagesContainer.appendChild(questionsContainer);
    }

    async sendMessage() {
      const text = this.messageInput.value.trim();
      if (!text || !this.isConnected) return;
      this.addMessage(text, "user");
      this.messageInput.value = "";

      try {
        this.showTyping();
        const res = await this.apiCall(
          "POST",
          `/chatbot-conversation/continue-conversation/${this.conversationId}`,
          { user_message: text }
        );
        this.hideTyping();

        const {
          display_type,
          response,
          follow_up_question,
          products = [],
          // for comparison you might return `attributes` or embed them in `products`
          comparison_attributes = [],
        } = res.data;

        switch (display_type) {
          case "product_card":
            // first show the bot's introductory text (if any)
            if (response) this.addMessage(response, "bot");
            // then show the single detailed card
            if (products[0]) this.addProductCard(products[0]);
            break;

          case "product_grid":
            // show grid of products
            this.addProductCards(products);
            break;

          case "comparison_table":
            // optional header text
            if (response) this.addMessage(response, "bot");
            // render side-by-side comparison
            this.addComparisonTable(products, comparison_attributes);
            break;

          case "text":
          default:
            // plain conversational text
            this.addMessage(response || "Sorry, I didn't get that.", "bot");
            break;
        }

        if (follow_up_question) {
          this.addMessage(follow_up_question, "bot");
        }
      } catch (err) {
        this.hideTyping();
        console.error("Send message failed:", err);
        this.addMessage("Oops! Something went wrong.", "bot");
      }
    }

    /**
     * Renders an array of product objects into cards
     * each product should have { name, price, imageUrl, description }
     */
    addProductCards(products) {
      const grid = document.createElement("div");
      grid.className = "product-grid";

      products.forEach((p) => {
        const a = document.createElement("a");
        a.href = p.url || "#";
        a.className = "product-grid-item";

        a.innerHTML = `
        <img src="${p.image}" alt="${p.name}" class="product-grid-image">
        <div class="product-grid-info">
          <div class="product-grid-name">${p.name}</div>
          <div class="product-grid-price">${p.price}</div>
        </div>
      `;
        grid.appendChild(a);
      });

      this.messagesContainer.appendChild(grid);
      this.scrollToBottom();
    }

    /**
     * Renders one detailed product card with optional extras.
     * Expects product = { name, price, image, url, description?, key_features?, ratings?, availability? }
     */
    addProductCard(product) {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-image" />
    <div class="product-info">
      <div class="product-name">${product.name}</div>
      <div class="product-price">${product.price}</div>
      ${
        product.description
          ? `<div class="product-description">${product.description}</div>`
          : ""
      }
      ${
        product.key_features
          ? `
        <ul class="product-features">
          ${product.key_features.map((f) => `<li>• ${f}</li>`).join("")}
        </ul>
      `
          : ""
      }
      ${
        product.ratings
          ? `<div class="product-rating">Rating: ${product.ratings} ⭐</div>`
          : ""
      }
      ${
        product.availability
          ? `<div class="product-availability">${product.availability}</div>`
          : ""
      }
      <a href="${product.url}" class="product-link">View Product</a>
    </div>
  `;

      this.messagesContainer.appendChild(card);
      this.scrollToBottom();
    }

    /**
     * Renders a table comparing multiple products across given attributes.
     * products = [ { name, price, image, url, ...attr }, ... ]
     * attrs = [ 'price', 'processor', 'size_options', ... ]
     */
    addComparisonTable(products, attrs) {
      // build header row
      const table = document.createElement("table");
      table.className = "comparison-table";

      // header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      headerRow.innerHTML = `
    <th>Feature</th>
    ${products.map((p) => `<th><a href="${p.url}">${p.name}</a></th>`).join("")}
  `;
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // body rows
      const tbody = document.createElement("tbody");
      attrs.forEach((attr) => {
        const row = document.createElement("tr");
        const labelCell = document.createElement("td");
        labelCell.textContent = attr.replace(/_/g, " ");
        row.appendChild(labelCell);

        products.forEach((p) => {
          const cell = document.createElement("td");
          cell.textContent = p[attr] || "–";
          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      // append into chat
      const wrapper = document.createElement("div");
      wrapper.className = "comparison-wrapper";
      wrapper.appendChild(table);
      this.messagesContainer.appendChild(wrapper);
      this.scrollToBottom();
    }

    async handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      // show preview bubble
      const reader = new FileReader();
      reader.onload = () => {
        const imgEl = document.createElement("img");
        imgEl.src = reader.result;
        imgEl.style.maxWidth = "200px";
        imgEl.style.borderRadius = "8px";
        this.messagesContainer.appendChild(imgEl);
        this.scrollToBottom();
      };
      reader.readAsDataURL(file);

      // prepare form data
      const form = new FormData();
      form.append("file", file);

      // call your image endpoint
      try {
        const res = await fetch(
          `${this.config.apiUrl}/chatbot-conversation/image/${this.conversationId}`,
          {
            method: "POST",
            body: form,
            headers: {
              ...(this.config.accessToken && {
                Authorization: `Bearer ${this.config.accessToken}`,
              }),
            },
          }
        );
        const data = await res.json();
        this.addMessage(data.data.response, "bot");
      } catch (err) {
        console.error("Image upload failed", err);
        this.addMessage("Image upload failed.", "bot");
      }
    }

    // 2) toggleRecording & send audio via MediaRecorder
    toggleRecording() {
      if (!this.mediaRecorder) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = (e) =>
              this.audioChunks.push(e.data);
            this.mediaRecorder.onstop = () => this.sendAudioMessage();
            this.mediaRecorder.start();
            this.audioBtn = this.container.querySelector(".chatbot-audio-btn");
            this.audioBtn.textContent = "⏹️"; // change icon to stop
          })
          .catch((err) => console.error("Mic error", err));
      } else if (this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
        this.mediaRecorder = null;
        this.audioBtn.textContent = "🎤";
      }
    }

    async sendAudioMessage() {
      const blob = new Blob(this.audioChunks, { type: "audio/webm" });
      this.audioChunks = [];
      const form = new FormData();
      form.append("file", blob, "voice.webm");

      // show a placeholder
      this.addMessage("[Voice message]", "user");

      try {
        const res = await fetch(
          `${this.config.apiUrl}/chatbot-conversation/audio/${this.conversationId}`,
          {
            method: "POST",
            body: form,
            headers: {
              ...(this.config.accessToken && {
                Authorization: `Bearer ${this.config.accessToken}`,
              }),
            },
          }
        );
        const data = await res.json();
        this.addMessage(data.data.response, "bot");
      } catch (err) {
        console.error("Audio send failed", err);
        this.addMessage("Audio send failed.", "bot");
      }
    }

    addMessage(text, sender) {
      const msgEl = document.createElement("div");
      msgEl.className = `chatbot-message ${sender}`;
      
      if (sender === 'bot') {
        const avatar = document.createElement("div");
        avatar.className = "chatbot-message-avatar";
        avatar.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        `;
        msgEl.appendChild(avatar);
      }
      
      const content = document.createElement("div");
      content.className = "chatbot-message-content";
      content.textContent = text;
      msgEl.appendChild(content);
      
      this.messagesContainer.appendChild(msgEl);
      this.scrollToBottom();
    }

    showTyping() {
      this.typingEl = document.createElement("div");
      this.typingEl.className = "chatbot-typing";
      this.typingEl.innerHTML = `
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
      `;
      this.messagesContainer.appendChild(this.typingEl);
      this.scrollToBottom();
    }

    hideTyping() {
      if (this.typingEl) {
        this.messagesContainer.removeChild(this.typingEl);
        this.typingEl = null;
      }
    }

    scrollToBottom() {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  // Expose to global and initialize
  window.ChatbotWidget = ChatbotWidget;
  window.chatbotWidget = new ChatbotWidget(window.chatbotWidgetConfig || {});
})();

