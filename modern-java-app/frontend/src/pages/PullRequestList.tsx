import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Shield, GitPullRequest, ExternalLink, Loader, Play, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

interface PullRequest {
  id: number
  number: number
  title: string
  author: string
  htmlUrl: string
  baseBranch: string
  headBranch: string
}

export default function PullRequestList() {
  const navigate = useNavigate()
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repoName, setRepoName] = useState('')
  const [runningReview, setRunningReview] = useState<number | null>(null)

  useEffect(() => {
    const selectedRepoId = localStorage.getItem('selectedRepoId')
    const selectedRepoName = localStorage.getItem('selectedRepoName')

    if (!selectedRepoId) {
      navigate('/app/select-repo')
      return
    }

    setRepoName(selectedRepoName || 'Repository')
    fetchPullRequests(selectedRepoId)
  }, [navigate])

  const fetchPullRequests = async (repoId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/repos/${repoId}/pull-requests`)
      setPullRequests(response.data)
    } catch (err: any) {
      console.error('Error fetching pull requests:', err)
      const errorMessage = err.response?.status === 401 
        ? 'Authentication required. Please login with GitHub.'
        : err.response?.data?.message || 'Failed to load pull requests.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const runAIReview = async (prId: number, prNumber: number) => {
    try {
      setRunningReview(prId)
      const response = await api.post(`/api/reviews/run/${prId}`)
      console.log('Review response:', response.data)
      alert(`AI Review for PR #${prNumber} completed! Check the results.`)
    } catch (err: any) {
      console.error('Review error:', err)
      const errorMsg = err.response?.data?.message || 'Failed to run AI review'
      alert(`Review failed: ${errorMsg}`)
    } finally {
      setRunningReview(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading pull requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 border border-red-500">
          <h2 className="text-xl font-bold text-white mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/app')}
            className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Pull Requests</h1>
            <p className="text-xl text-slate-300">{repoName}</p>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* PR List */}
        {pullRequests.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <GitPullRequest className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Pull Requests Found</h3>
            <p className="text-slate-400 mb-6">
              Click "Sync Data" on the Dashboard to fetch pull requests from GitHub.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pullRequests.map((pr, index) => (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-brand-400" />
                      <h3 className="text-lg font-semibold text-white">
                        #{pr.number} {pr.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span>by {pr.author}</span>
                      <span>•</span>
                      <span>{pr.baseBranch} ← {pr.headBranch}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={pr.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-400 transition"
                      title="View on GitHub"
                    >
                      <ExternalLink size={20} />
                    </a>
                    <button
                      onClick={() => navigate(`/app/pull-requests/${pr.id}/review`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <FileText className="w-4 h-4" />
                      View Report
                    </button>
                    <button
                      onClick={() => runAIReview(pr.id, pr.number)}
                      disabled={runningReview === pr.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {runningReview === pr.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Run AI Review
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
