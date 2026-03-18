import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, DollarSign } from 'lucide-react';
import { WeddingDayAttendee } from '../types/attendance';
import {
  addWeddingDayAttendee,
  getWeddingDayAttendees,
  updateWeddingDayAttendee
} from '../utils/storage';
import { GiftTracking } from './GiftTracking';

interface WeddingDayAttendanceProps {
  onBack: () => void;
}

export const WeddingDayAttendance: React.FC<WeddingDayAttendanceProps> = ({ onBack }) => {
  const [attendees, setAttendees] = useState<WeddingDayAttendee[]>([]);
  const [formData, setFormData] = useState({ name: '', expectedCount: 1 });
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCounts, setEditingCounts] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showGiftTracking, setShowGiftTracking] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, []);

  const loadAttendees = async () => {
    try {
      setIsLoading(true);
      const data = await getWeddingDayAttendees();
      setAttendees(data);
      setError('');
    } catch (err) {
      setError('Failed to load attendees');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.expectedCount < 1) {
      setError('Name and count are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const newAttendee: Omit<WeddingDayAttendee, 'id'> = {
        name: formData.name.trim(),
        expectedCount: formData.expectedCount,
        attended: false,
        actualCount: formData.expectedCount,
        giftAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addWeddingDayAttendee(newAttendee);
      setFormData({ name: '', expectedCount: 1 });
      setError('');
      setShowModal(false);
      await loadAttendees();
    } catch (err) {
      setError('Failed to add attendee');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAddAttendees = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkText.trim()) {
      setError('Please enter attendee data');
      return;
    }

    setIsSubmitting(true);
    try {
      const lines = bulkText.trim().split('\n').filter(line => line.trim());
      const newAttendees: Omit<WeddingDayAttendee, 'id'>[] = [];
      const errors: string[] = [];

      lines.forEach((line, index) => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 2) {
          errors.push(`Line ${index + 1}: Expected format "Name, Count"`);
          return;
        }

        const name = parts[0].trim();
        const count = parseInt(parts[1]);

        if (!name) {
          errors.push(`Line ${index + 1}: Name cannot be empty`);
          return;
        }

        if (isNaN(count) || count < 1) {
          errors.push(`Line ${index + 1}: Count must be a valid number`);
          return;
        }

        newAttendees.push({
          name,
          expectedCount: count,
          attended: false,
          actualCount: count,
          giftAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      if (errors.length > 0) {
        setError(errors.join('\n'));
        return;
      }

      if (newAttendees.length === 0) {
        setError('No valid attendees found');
        return;
      }

      for (const attendee of newAttendees) {
        await addWeddingDayAttendee(attendee);
      }

      setBulkText('');
      setError('');
      setShowModal(false);
      setIsBulkMode(false);
      await loadAttendees();
    } catch (err) {
      setError('Failed to add attendees');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAttended = async (attendee: WeddingDayAttendee) => {
    try {
      const currentCount = editingCounts[attendee.id] ?? attendee.actualCount;
      await updateWeddingDayAttendee(attendee.id, { 
        attended: !attendee.attended,
        actualCount: currentCount
      });
      setEditingCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[attendee.id];
        return newCounts;
      });
      await loadAttendees();
    } catch (err) {
      setError('Failed to update attendee');
      console.error(err);
    }
  };

  const handleUpdateCount = async (attendeeId: string, actualCount: number) => {
    if (actualCount < 0) return;
    try {
      await updateWeddingDayAttendee(attendeeId, { actualCount });
      setEditingCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[attendeeId];
        return newCounts;
      });
      await loadAttendees();
    } catch (err) {
      setError('Failed to update count');
      console.error(err);
    }
  };

  const handleCountChange = (attendeeId: string, value: number) => {
    setEditingCounts(prev => ({
      ...prev,
      [attendeeId]: value
    }));
  };

  const allAttendees = [...attendees].sort((a, b) => a.name.localeCompare(b.name));
  const participated = attendees.filter(a => a.attended).sort((a, b) => a.name.localeCompare(b.name));
  const notYet = attendees.filter(a => !a.attended).sort((a, b) => a.name.localeCompare(b.name));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading attendees...</div>
      </div>
    );
  }

  if (showGiftTracking) {
    return <GiftTracking onBack={() => setShowGiftTracking(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 gap-4 flex-wrap">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to admin panel"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Wedding Day Attendance</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGiftTracking(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Track gift amounts"
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Gifts</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                title="Add new attendee"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Attendee</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Three Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Not Yet Card with Checkboxes */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-amber-600 text-white p-4">
              <h2 className="text-lg font-semibold">Not Yet</h2>
              <p className="text-amber-100 text-sm">Total: {notYet.length} people</p>
              <p className="text-amber-100 text-sm">
                Total Count: {notYet.reduce((sum, a) => sum + a.actualCount, 0)}
              </p>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {notYet.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Everyone has been marked</p>
              ) : (
                <div className="space-y-2">
                  {notYet.map(attendee => (
                    <div
                      key={attendee.id}
                      className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-3"
                    >
                      <input
                        id={`notyet-checkbox-${attendee.id}`}
                        type="checkbox"
                        checked={false}
                        title="Mark attendee as participated"
                        onChange={() => handleToggleAttended(attendee)}
                        className="w-5 h-5 text-amber-600 rounded cursor-pointer"
                      />
                      <label htmlFor={`notyet-checkbox-${attendee.id}`} className="flex-1 min-w-0 cursor-pointer">
                        <p className="font-semibold text-gray-900 truncate">{attendee.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">Count:</span>
                          <input
                            id={`notyet-count-${attendee.id}`}
                            type="number"
                            min="0"
                            title="Actual attendance count"
                            value={editingCounts[attendee.id] ?? attendee.actualCount}
                            onChange={(e) => handleCountChange(attendee.id, parseInt(e.target.value) || 0)}
                            onBlur={(e) => handleUpdateCount(attendee.id, parseInt(e.target.value) || 0)}
                            className="w-12 px-2 py-1 border border-amber-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Participated Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white p-4">
              <h2 className="text-lg font-semibold">Participated</h2>
              <p className="text-green-100 text-sm">Total: {participated.length} people</p>
              <p className="text-green-100 text-sm">
                Total Count: {participated.reduce((sum, a) => sum + a.actualCount, 0)}
              </p>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {participated.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No one has participated yet</p>
              ) : (
                participated.map(attendee => (
                  <div key={attendee.id} className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{attendee.name}</p>
                      <p className="text-xs text-green-600">✓ Marked as attended</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`participated-count-${attendee.id}`} className="text-sm text-gray-600">Count:</label>
                      <input
                        id={`participated-count-${attendee.id}`}
                        type="number"
                        min="0"
                        title="Actual count"
                        value={attendee.actualCount}
                        disabled
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All Attendees Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-lg font-semibold">All Attendees</h2>
              <p className="text-blue-100 text-sm">Total: {allAttendees.length} people</p>
              <p className="text-blue-100 text-sm">
                Total Count: {allAttendees.reduce((sum, a) => sum + a.actualCount, 0)}
              </p>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {allAttendees.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attendees added yet</p>
              ) : (
                allAttendees.map(attendee => (
                  <div key={attendee.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{attendee.name}</p>
                      <p className="text-sm text-gray-600">Expected: {attendee.expectedCount}</p>
                      <p className="text-xs text-gray-500">
                        Status: {attendee.attended ? '✓ Participated' : '○ Not Yet'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`all-count-${attendee.id}`} className="text-sm text-gray-600">Count:</label>
                      <input
                        id={`all-count-${attendee.id}`}
                        type="number"
                        min="0"
                        title="Actual count"
                        value={attendee.actualCount}
                        disabled
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Attendee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isBulkMode ? 'Bulk Add Attendees' : 'Add New Attendee'}
              </h2>
              <button
                type="button"
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                disabled={isSubmitting}
              >
                {isBulkMode ? 'Single Add' : 'Bulk Add'}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm whitespace-pre-wrap">
                {error}
              </div>
            )}

            {!isBulkMode ? (
              <form onSubmit={handleAddAttendee} className="space-y-4">
                <div>
                  <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Attendee Name
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    placeholder="Enter attendee name"
                    title="Attendee name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="modal-count" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Count
                  </label>
                  <input
                    id="modal-count"
                    type="number"
                    min="1"
                    title="Expected attendee count"
                    value={formData.expectedCount}
                    onChange={(e) => setFormData({ ...formData, expectedCount: parseInt(e.target.value) || 1 })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Attendee'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ name: '', expectedCount: 1 });
                      setError('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleBulkAddAttendees} className="space-y-4">
                <div>
                  <label htmlFor="bulk-text" className="block text-sm font-medium text-gray-700 mb-2">
                    Attendees (Format: Name, Count)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Enter one attendee per line. Example:<br />
                    John Doe, 2<br />
                    Jane Smith, 1
                  </p>
                  <textarea
                    id="bulk-text"
                    placeholder="John Doe, 2&#10;Jane Smith, 1&#10;Bob Johnson, 3"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm resize-none"
                    rows={8}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {isSubmitting ? 'Adding...' : 'Add All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setBulkText('');
                      setError('');
                      setIsBulkMode(false);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
