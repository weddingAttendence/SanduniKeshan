import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, CheckCircle, XCircle, Search, Download, Clock } from 'lucide-react';
import { AttendanceSubmission } from '../types/attendance';
import { getSubmissions } from '../utils/storage';
import { WeddingDayAttendance } from './WeddingDayAttendance';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [submissions, setSubmissions] = useState<AttendanceSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'attending' | 'not-attending'>('all');
  const [showWeddingDayView, setShowWeddingDayView] = useState(false);

  useEffect(() => {
    const loadSubmissions = async () => {
      const data = await getSubmissions();
      setSubmissions(data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    };
    
    loadSubmissions();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadSubmissions, 30000);
    return () => clearInterval(interval);
  }, []);

  if (showWeddingDayView) {
    return <WeddingDayAttendance onBack={() => setShowWeddingDayView(false)} />;
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'attending' && submission.participating) ||
      (filterStatus === 'not-attending' && !submission.participating);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: submissions.length,
    attending: submissions.filter(s => s.participating).length,
    notAttending: submissions.filter(s => !s.participating).length,
    totalAttendingPeople: submissions.reduce((sum, s) => sum + (s.attendeeCount || 0), 0),
    totalNotAttendingPeople: submissions.reduce((sum, s) => sum + (s.nonAttendeeCount ?? 0), 0)
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Attending', 'Attending Count', 'Not Attending Count', 'Note', 'Submitted At'],
      ...submissions.map(s => [
        s.name,
        s.participating ? 'Yes' : 'No',
        (s.attendeeCount || 0).toString(),
        (s.nonAttendeeCount ?? 0).toString(),
        s.note || '',
        new Date(s.submittedAt).toLocaleString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-attendance.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-rose-600 mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wedding Admin Panel</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto flex-wrap">
              <button
                onClick={() => setShowWeddingDayView(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                title="Manage wedding day attendance"
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Wedding Day Tracking</span>
                <span className="sm:hidden">Tracking</span>
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                title="Export attendance data to CSV"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                title="Logout from admin panel"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Attending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Not Attending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.notAttending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Attending People</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAttendingPeople}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Not Attending People</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotAttendingPeople}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              title="Filter responses by attendance status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">All Responses</option>
              <option value="attending">Attending Only</option>
              <option value="not-attending">Not Attending Only</option>
            </select>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Submissions will appear here as people respond.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          submission.participating
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {submission.participating ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Attending
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Attending
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.participating ? (submission.attendeeCount || 0) : (submission.nonAttendeeCount ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {submission.note ? (
                          <div title={submission.note} className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1 text-gray-400" />
                            {submission.note}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};