import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';
import { 
  Brain, Sparkles, Mic, Layers, Zap, ChevronRight, 
  FileText, Bot, Keyboard, Smartphone, Search, Users,
  ArrowRight, CheckCircle
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isLoading = useAppStore(state => state.isLoading);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BrainFlowy...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Redirect to outlines page immediately if logged in
    navigate('/outlines');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Thought Organization</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Ideas Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Structured Knowledge</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            BrainFlowy combines the simplicity of bullet-point note-taking with the power of AI assistance, 
            creating the ultimate tool for organizing thoughts, building knowledge, and generating insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Sign In
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Organize Your Mind</h2>
            <p className="text-lg text-gray-600">Powerful features designed for how you actually think</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: AI Assistant */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Assistant</h3>
              <p className="text-gray-600 mb-3">
                Generate content, enhance ideas, and research topics with integrated LLM assistance. 
                Smart section placement ensures content goes exactly where it belongs.
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Create & edit content</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Research mode</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Context-aware responses</li>
              </ul>
            </div>

            {/* Feature 2: Hierarchical Organization */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Infinite Hierarchy</h3>
              <p className="text-gray-600 mb-3">
                Create deeply nested outlines with unlimited levels. Drag-and-drop reordering, 
                expand/collapse sections, and maintain perfect organization.
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Unlimited nesting</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Drag & drop</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Auto-save</li>
              </ul>
            </div>

            {/* Feature 3: Templates */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Templates</h3>
              <p className="text-gray-600 mb-3">
                Jump-start your thinking with Brainlift templates. DOK levels, SPOV frameworks, 
                and structured sections for comprehensive analysis.
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />DOK Levels 1-4</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Strategic frameworks</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />One-click apply</li>
              </ul>
            </div>

            {/* Feature 4: Voice Input */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Voice Mode</h3>
              <p className="text-gray-600 mb-3">
                Capture thoughts hands-free with voice transcription. Seamlessly converts speech 
                to organized outline items.
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Speech-to-text</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Hands-free capture</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />AI enhancement</li>
              </ul>
            </div>

            {/* Feature 5: Performance */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600 mb-3">
                Surgical updates ensure only changed items refresh. No lag, no flicker, 
                just instant response to every action.
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Instant updates</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />No full refresh</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Optimized sync</li>
              </ul>
            </div>

            {/* Feature 6: Multi-Platform */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Works Everywhere</h3>
              <p className="text-gray-600 mb-3">
                Responsive design adapts to any screen. Desktop power features, mobile touch 
                gestures, and seamless sync across devices.
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Desktop & mobile</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Touch optimized</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Real-time sync</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for How You Work</h2>
            <p className="text-lg text-gray-600">From brainstorming to execution</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg">
              <Brain className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Knowledge Management</h3>
                <p className="text-gray-600">Organize research, notes, and insights in a searchable, hierarchical structure.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg">
              <Users className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Project Planning</h3>
                <p className="text-gray-600">Break down complex projects into actionable tasks and subtasks.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg">
              <FileText className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Content Creation</h3>
                <p className="text-gray-600">Draft articles, essays, and documentation with AI-powered assistance.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg">
              <Search className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Learning & Study</h3>
                <p className="text-gray-600">Create comprehensive study guides with DOK levels and structured learning paths.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform How You Think?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands organizing their minds with BrainFlowy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center px-8 py-4 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              Sign In
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} BrainFlowy. Transform ideas into structured knowledge.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;