import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Shield, FileText, AlertTriangle, Info, CheckCircle, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface ReviewComment {
  id: number
  filePath: string
  lineNumber: number
  severity: string
  category: string
  body: string
  rationale: string
  suggestion: string
}

interface ReviewRun {
  id: number
  summary: string
  commentCount: number
  comments: ReviewComment[]
  createdAt: string
}

export default function ReviewResult() {
  const { prId } = useParams<{ prId: string }>()
  const navigate = useNavigate()
  const [review, setReview] = useState<ReviewRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!prId) {
      navigate('/app/pull-requests')
      return
    }

    fetchReview(prId)
  }, [prId, navigate])

  const fetchReview = async (prId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/reviews/pr/${prId}`)
      
      if (response.data && response.data.length > 0) {
        // Get the most recent review (last in array)
        const latestReview = response.data[response.data.length - 1]
        setReview(latestReview)
      } else {
        setError('No review found for this pull request.')
      }
    } catch (err: any) {
      console.error('Error fetching review:', err)
      setError(err.response?.data?.message || 'Failed to load review.')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-brand-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-300">Loading review...</p>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">No Review Found</h2>
          <p className="text-slate-300 mb-6">
            {error || 'No AI review has been run for this pull request yet.'}
          </p>
          <button
            onClick={() => navigate('/app/pull-requests')}
            className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            Back to Pull Requests
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/pull-requests')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pull Requests
          </button>
          <div className="flex items-center gap-4">
            <Shield className="w-10 h-10 text-brand-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">AI Review Results</h1>
              <p className="text-slate-400">Pull Request #{prId}</p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Summary</h2>
              <p className="text-slate-200 leading-relaxed">{review.summary}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                <span>{review.commentCount} comments</span>
                <span>•</span>
                <span>{new Date(review.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comments List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Comments ({review.comments.length})</h2>
          
          {review.comments.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
              <p className="text-slate-400">No issues found in this pull request.</p>
            </div>
          ) : (
            review.comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(comment.severity)}
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-white font-mono text-sm">
                          {comment.filePath}:{comment.lineNumber}
                        </span>
                      </div>
                      <span className="text-slate-400 text-sm">{comment.category}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadgeClass(comment.severity)}`}>
                    {comment.severity}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-1">AI Review</h4>
                    <p className="text-white whitespace-pre-wrap">{comment.body}</p>
                  </div>

                  {comment.suggestion && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-400 mb-1">Suggestion</h4>
                      <p className="text-green-400">{comment.suggestion}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
