import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Send, Bot, User, Loader, Menu, Shield, GitPullRequest, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const NavItem = ({ icon: Icon, label, to }: any) => {
  const navigate = useNavigate()
  const isActive = window.location.pathname === to
  
  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        isActive
          ? 'bg-brand-600 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

export default function Chat() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Repo Mind AI. Ask me anything about your codebase, and I'll provide context-aware answers using RAG."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [repoId, setRepoId] = useState<string | null>(null)
  const [repoName, setRepoName] = useState('')
  const [conversationId, setConversationId] = useState<string>(() => {
    // Generate or retrieve conversation ID
    const existing = sessionStorage.getItem('chatConversationId')
    if (existing) return existing
    const newId = crypto.randomUUID()
    sessionStorage.setItem('chatConversationId', newId)
    return newId
  })

  useEffect(() => {
    const selectedRepoId = localStorage.getItem('selectedRepoId')
    const selectedRepoName = localStorage.getItem('selectedRepoName')
    if (!selectedRepoId) {
      navigate('/app/select-repo')
      return
    }
    setRepoId(selectedRepoId)
    setRepoName(selectedRepoName || 'Repository')
  }, [navigate])

  const handleSend = async () => {
    if (!input.trim() || !repoId || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      console.log('Sending message with repoId:', repoId, 'conversationId:', conversationId)
      const response = await api.post('/api/chat', {
        message: input,
        repoId: parseInt(repoId),
        conversationId: conversationId
      })

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.answer
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (err: any) {
      console.error('Error sending message:', err)
      
      const errorText = err.response?.status === 401
        ? 'Error: Authentication required. Please login with GitHub.'
        : err.response?.data?.message || 'Error: Unable to reach AI service. Please check your connection.'
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorText
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        className="w-64 bg-slate-800 border-r border-slate-700 p-6 fixed h-full z-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-brand-400" />
          <h2 className="text-xl font-bold text-white">Repo Mind</h2>
        </div>

        <nav className="space-y-2">
          <NavItem icon={Shield} label="Dashboard" to="/app" />
          <NavItem icon={GitPullRequest} label="Pull Requests" to="/app/pull-requests" />
          <NavItem icon={MessageSquare} label="Chat" to="/app/chat" />
        </nav>

        <div className="mt-8 pt-8 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2">Current Repository</p>
          <p className="text-sm text-white font-semibold truncate">{repoName}</p>
          <button
            onClick={() => navigate('/app/select-repo')}
            className="mt-2 text-xs text-brand-400 hover:text-brand-300"
          >
            Change Repository
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all flex flex-col`}>
        {/* Top Bar */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8 text-brand-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">Chat with Your Codebase</h1>
                  <p className="text-sm text-slate-400">RAG-powered AI assistant</p>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold">
              U
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
                
                <div
                  className={`px-6 py-4 rounded-2xl max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="px-6 py-4 rounded-2xl bg-slate-800 border border-slate-700">
                  <Loader className="w-5 h-5 text-brand-400 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={loading}
                placeholder="Ask about your codebase..."
                className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-brand-500 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Powered by RAG and GPT-4. Press Enter to send.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
