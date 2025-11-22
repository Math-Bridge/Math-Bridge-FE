import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import * as api from './api';
import { apiService } from './api';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. Customer support chat will not work.');
}

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class GeminiService {
  private model = genAI?.getGenerativeModel({
    model: 'gemini-2.5-flash',
  });
  private chat: ReturnType<NonNullable<typeof this.model>['startChat']> | null = null;
  private currentUser: any = null;



  /**
   * Set the current user context
   */
  setUserContext(user: any) {
    this.currentUser = user;
  }

  /**
   * Fetch relevant user data based on their role
   */
  private async fetchUserData(): Promise<string> {
    if (!this.currentUser) {
      return '';
    }

    const dataPoints: string[] = [];

    try {
      const role = this.currentUser.role?.toLowerCase();

      // Parent-specific data
      if (role === 'parent') {
        try {
          const childrenResponse = await api.getChildrenByParent(this.currentUser.id);
          if (childrenResponse.success && childrenResponse.data?.length > 0) {
            dataPoints.push(`\n\n[User's Registered Children]`);
            childrenResponse.data.forEach((c: any, index: number) => {
              dataPoints.push(`${index + 1}. ${c.fullName} - Grade ${c.grade} at ${c.schoolName}${c.centerName ? ', Center: ' + c.centerName : ''}`);
            });
          } else {
            dataPoints.push(`\nNo children registered yet`);
          }

          const contractsResponse = await api.getContractsByParent(this.currentUser.id);
          if (contractsResponse.success && contractsResponse.data?.length > 0) {
            dataPoints.push(`\nActive Contracts: ${contractsResponse.data.length} contract(s)`);
            const activeContracts = contractsResponse.data.filter((c: any) => c.status === 'Active');
            if (activeContracts.length > 0) {
              dataPoints.push(`Active: ${activeContracts.map((c: any) => 
                `${c.childName} with tutor ${c.mainTutorName} (${c.isOnline ? 'Online' : 'Offline'})`
              ).join(', ')}`);
            }
          }
        } catch (err) {
          console.error('Error fetching parent data:', err);
        }
      }

      // Tutor-specific data
      if (role === 'tutor') {
        try {
          const sessionsResponse = await api.getTutorSessions(this.currentUser.id);
          if (sessionsResponse.success && sessionsResponse.data?.length > 0) {
            const upcomingSessions = sessionsResponse.data.filter((s: any) => 
              new Date(s.sessionDate) > new Date() && s.status === 'Scheduled'
            );
            dataPoints.push(`\nUpcoming Sessions: ${upcomingSessions.length} session(s)`);
          }
        } catch (err) {
          console.error('Error fetching tutor data:', err);
        }
      }

      // Common data for all users
      if (role === 'parent' || role === 'tutor') {
        try {
          const centersResponse = await api.getAllCenters();
          if (centersResponse.success && centersResponse.data?.length > 0) {
            dataPoints.push(`\nAvailable Centers: ${centersResponse.data.length} center(s)`);
          }
        } catch (err) {
          console.error('Error fetching centers:', err);
        }
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    return dataPoints.join('\n');
  }

  /**
   * Initialize a new chat session with context about Math Bridge
   */
  async initializeChat() {
    if (!this.model) {
      throw new Error('Gemini AI is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    console.log('Initializing Gemini chat with API key:', API_KEY ? 'Present' : 'Missing');

    // Fetch user-specific data
    const userData = await this.fetchUserData();

    // Build context
    let userInfo = '';
    if (this.currentUser) {
      userInfo = `\n\nCurrent User Information:
- Name: ${this.currentUser.name}
- Email: ${this.currentUser.email}
- Role: ${this.currentUser.role || 'User'}
- Account Created: ${this.currentUser.createdAt ? new Date(this.currentUser.createdAt).toLocaleDateString() : 'N/A'}`;
      
      if (userData) {
        userInfo += userData;
      }
    }

    const systemContext = `You are a helpful customer support assistant for Math Bridge, an educational platform that connects students with tutors for math learning. 

Key features of Math Bridge:
- Students can find and book sessions with qualified math tutors
- Parents can manage their children's learning profiles
- We offer various tutoring packages and learning centers
- Users can schedule sessions, track progress, and manage contracts
- We support multiple roles: students, parents, tutors, staff, and administrators
- Sessions can be conducted online or at physical learning centers
- Progress tracking through daily reports and test results
- Flexible reschedule options for sessions
- Wallet system for payments and transactions

CRITICAL RULES:
1. Be friendly, professional, helpful
2. **NEVER make up prices or packages** - Only use data in [SYSTEM: ...] tags
3. **When you see [SYSTEM: Available Packages]** - Use ONLY those packages with their exact prices
4. **DO NOT invent generic examples** like "Standard Package $199" - These are FAKE
5. When user mentions a child, use their actual data from [SYSTEM: Your Children]
6. **If asking to "recommend" packages** - Present packages suitable for the child's grade level
7. Reference specific names, dates, prices from provided data
8. Format clearly with bullets/numbers
9. If no data provided, say "Let me check our current offerings"

Topics you can help with:
- How to use the platform and navigate features
- Booking tutoring sessions and finding tutors
- Managing profiles, children, and accounts
- Subscription packages and pricing
- Payment, billing, and wallet transactions
- Session scheduling and rescheduling
- Progress tracking and reports
- Tutor registration and verification
- Center information and locations
- Contract management
- Technical troubleshooting${userInfo}`;

    this.chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemContext }],
        },
        {
          role: 'model',
          parts: [{ text: this.currentUser 
            ? `Hello ${this.currentUser.name}! I'm the Math Bridge support assistant. I can see you're logged in as a ${this.currentUser.role || 'user'}. How can I help you today?`
            : 'Hello! I\'m the Math Bridge support assistant. I\'m here to help you with any questions about our tutoring platform. How can I assist you today?' }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // Increased from 1024 to allow complete responses with multiple packages
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });
  }

  /**
   * Check if a message requires API data and fetch it
   */
  private async handleApiQueries(message: string): Promise<string> {
    if (!this.currentUser) {
      return '';
    }

    const messageLower = message.toLowerCase();
    let additionalContext = '';

    try {
      // Check for center-related queries
      if (messageLower.includes('center') || messageLower.includes('location') || messageLower.includes('address')) {
        const centersResponse = await api.getAllCenters();
        if (centersResponse.success && centersResponse.data && centersResponse.data.length > 0) {
          additionalContext += `\n\n[SYSTEM: Available Centers]\n`;
          centersResponse.data.slice(0, 5).forEach((center: any) => {
            additionalContext += `- ${center.name}: ${center.address}${center.phone ? ', Phone: ' + center.phone : ''}\n`;
          });
        }
      }

      // Check for tutor-related queries
      if (messageLower.includes('tutor') || messageLower.includes('teacher') || messageLower.includes('available')) {
        if (messageLower.includes('available') || messageLower.includes('find')) {
          const tutorsResponse = await api.getAvailableTutors();
          if (tutorsResponse.success && tutorsResponse.data && tutorsResponse.data.length > 0) {
            additionalContext += `\n\n[SYSTEM: Available Tutors]\n`;
            tutorsResponse.data.slice(0, 5).forEach((tutor: any) => {
              additionalContext += `- ${tutor.fullName || tutor.name}${tutor.specialization ? ' (Specialization: ' + tutor.specialization + ')' : ''}\n`;
            });
          }
        }
      }

      // Check for session/booking queries
      if ((messageLower.includes('session') || messageLower.includes('booking') || messageLower.includes('schedule')) && this.currentUser.role === 'parent') {
        const sessionsResponse = await api.getParentSessions(this.currentUser.id);
        if (sessionsResponse.success && sessionsResponse.data && sessionsResponse.data.length > 0) {
          const upcoming = sessionsResponse.data.filter((s: any) => 
            new Date(s.sessionDate) > new Date() && s.status === 'Scheduled'
          ).slice(0, 3);
          
          if (upcoming.length > 0) {
            additionalContext += `\n\n[SYSTEM: Your Upcoming Sessions]\n`;
            upcoming.forEach((session: any) => {
              additionalContext += `- ${new Date(session.sessionDate).toLocaleDateString()} at ${session.timeSlot}: ${session.childName} with ${session.tutorName}\n`;
            });
          }
        }
      }

      // Check for child/student queries
      if ((messageLower.includes('child') || 
           messageLower.includes('children') || 
           messageLower.includes('student') || 
           messageLower.includes('kid') ||
           messageLower.includes('my son') ||
           messageLower.includes('my daughter') ||
           messageLower.includes('show me my') ||
           messageLower.includes('progress')) && 
          this.currentUser.role === 'parent') {
        const childrenResponse = await api.getChildrenByParent(this.currentUser.id);
        if (childrenResponse.success && childrenResponse.data && childrenResponse.data.length > 0) {
          additionalContext += `\n\n[IMPORTANT: User is asking about their children. Here is their ACTUAL data:]\n`;
          additionalContext += `[SYSTEM: Your Registered Children]\n`;
          childrenResponse.data.forEach((child: any, index: number) => {
            additionalContext += `${index + 1}. ${child.fullName}\n`;
            additionalContext += `   - Grade: ${child.grade}\n`;
            additionalContext += `   - School: ${child.schoolName}\n`;
            if (child.centerName) {
              additionalContext += `   - Learning Center: ${child.centerName}\n`;
            }
            if (child.dateOfBirth) {
              additionalContext += `   - Date of Birth: ${new Date(child.dateOfBirth).toLocaleDateString()}\n`;
            }
            additionalContext += `   - Status: ${child.status || 'Active'}\n\n`;
          });
          additionalContext += `IMPORTANT: Present this information directly to the user. Do not say you don't have access.\n`;
        } else {
          additionalContext += `\n\n[SYSTEM: No children found for this parent]\n`;
        }
      }

      // Check for package catalog queries (what packages are available)
      if (messageLower.includes('package') || 
          messageLower.includes('pricing') || 
          messageLower.includes('price') ||
          messageLower.includes('cost') ||
          messageLower.includes('offer') ||
          messageLower.includes('plan')) {
        console.log('Package query detected, fetching packages...');
        // Check if asking about available packages (not their own contracts)
        if (messageLower.includes('what') || 
            messageLower.includes('available') || 
            messageLower.includes('offer') ||
            messageLower.includes('show') ||
            messageLower.includes('list') ||
            messageLower.includes('recommend') ||
            messageLower.includes('suggest') ||
            messageLower.includes('which') ||
            messageLower.includes('best') ||
            !messageLower.includes('my')) {
          console.log('Calling apiService.getAllPackages()...');
          const packagesResponse = await apiService.getAllPackages();
          console.log('Packages API response:', packagesResponse);
          if (packagesResponse.success && packagesResponse.data && packagesResponse.data.length > 0) {
            console.log('Found', packagesResponse.data.length, 'packages');
            
            // Limit to top 10 most relevant packages to avoid overwhelming Gemini
            const limitedPackages = packagesResponse.data.slice(0, 10);
            console.log('Showing', limitedPackages.length, 'packages to keep context manageable');
            
            additionalContext += `\n\n[SYSTEM: Available Packages - USE ONLY THESE]\n`;
            additionalContext += `We have ${limitedPackages.length} packages. Present ONLY these with their real prices:\n\n`;
            
            limitedPackages.forEach((pkg: any, index: number) => {
              const packageName = pkg.packageName || pkg.name || pkg.title || 'Package';
              const price = pkg.price || pkg.cost || pkg.packagePrice;
              const sessions = pkg.totalSessions || pkg.sessionCount || pkg.sessions;
              const duration = pkg.durationInMonths || pkg.duration;
              
              additionalContext += `${index + 1}. ${packageName}\n`;
              if (price) {
                // Format price properly for VND (Vietnamese Dong)
                const formattedPrice = typeof price === 'number' 
                  ? price.toLocaleString('vi-VN') 
                  : price.toString();
                additionalContext += `   Price: ${formattedPrice} VND\n`;
              }
              if (sessions) additionalContext += `   Sessions: ${sessions}\n`;
              if (duration) additionalContext += `   Duration: ${duration} months\n`;
              // Only include description if it's short
              if (pkg.description && pkg.description.length < 100) {
                additionalContext += `   Info: ${pkg.description}\n`;
              }
              additionalContext += `\n`;
            });
            
            additionalContext += `IMPORTANT: If user asked about a child (grade/name provided above), recommend suitable packages for their grade level.\n\n`;
          }
        }
      }

      // Check for contract queries (user's own subscriptions)
      if ((messageLower.includes('contract') || 
           messageLower.includes('subscription') || 
           (messageLower.includes('my') && messageLower.includes('package'))) && 
          this.currentUser.role === 'parent') {
        const contractsResponse = await api.getContractsByParent(this.currentUser.id);
        if (contractsResponse.success && contractsResponse.data && contractsResponse.data.length > 0) {
          additionalContext += `\n\n[SYSTEM: Your Active Contracts]\n`;
          contractsResponse.data.forEach((contract: any) => {
            additionalContext += `- ${contract.childName}: ${contract.packageName} with ${contract.mainTutorName} (Status: ${contract.status})\n`;
          });
        }
      }

    } catch (error) {
      console.error('Error fetching API data for context:', error);
    }

    return additionalContext;
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.chat) {
      await this.initializeChat();
    }

    if (!this.model || !this.chat) {
      throw new Error('Gemini AI is not configured.');
    }

    try {
      console.log('Sending message to Gemini AI...');
      
      // Fetch additional API context if needed
      const apiContext = await this.handleApiQueries(message);
      console.log('API Context length:', apiContext.length);
      if (apiContext) {
        console.log('API Context preview:', apiContext.substring(0, 200) + '...');
      }
      const fullMessage = message + apiContext;

      const result = await this.chat.sendMessage(fullMessage);
      const response = await result.response;
      const text = response.text();
      console.log('Received response from Gemini AI');
      console.log('Response length:', text.length, 'characters');
      
      // Check for blank response
      if (!text || text.trim() === '') {
        console.warn('Gemini returned blank response. Context might be too large or filtered.');
        console.log('Full message length:', fullMessage.length);
        return "I apologize, but I'm having trouble processing that request. Could you try asking in a different way? For example, you could ask 'What are your top 5 packages?' or 'Show me packages for Grade 12 students'.";
      }
      
      // Check if response might be truncated (ends mid-sentence)
      const lastChar = text.trim().slice(-1);
      const lastTwoChars = text.trim().slice(-2);
      if (lastChar !== '.' && lastChar !== '!' && lastChar !== '?' && lastTwoChars !== '")' && lastTwoChars !== '.)') {
        console.warn('Response might be truncated - does not end with proper punctuation');
        console.warn('Last 50 chars:', text.slice(-50));
      }
      
      return text;
    } catch (error: unknown) {
      console.error('Detailed Gemini error:', error);

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Check for specific error types
        if (errorMessage.includes('api key') || errorMessage.includes('invalid') || errorMessage.includes('authentication')) {
          throw new Error('Invalid API key. Please verify your Gemini API key is correct.');
        }

        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          throw new Error('API rate limit reached. Please wait a moment and try again.');
        }

        if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          throw new Error('AI model error. The service may be temporarily unavailable.');
        }

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }

        if (errorMessage.includes('blocked') || errorMessage.includes('safety')) {
          throw new Error('Content filtered by safety settings. Please rephrase your message.');
        }

        // Return the actual error message for debugging
        throw new Error(`AI Error: ${error.message}`);
      }
      
      throw new Error('Failed to get response from AI assistant. Please try again.');
    }
  }

  /**
   * Reset the chat session
   */
  resetChat() {
    this.chat = null;
  }

  /**
   * Check if Gemini is configured
   */
  isConfigured(): boolean {
    return !!API_KEY && !!this.model;
  }
}

export const geminiService = new GeminiService();

