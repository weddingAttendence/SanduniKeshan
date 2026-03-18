import React, { useState, useEffect } from 'react';
import { ChevronLeft, DollarSign } from 'lucide-react';
import { WeddingDayAttendee } from '../types/attendance';
import { getWeddingDayAttendees, updateWeddingDayAttendee } from '../utils/storage';

interface GiftTrackingProps {
  onBack: () => void;
}

export const GiftTracking: React.FC<GiftTrackingProps> = ({ onBack }) => {
  const [attendees, setAttendees] = useState<WeddingDayAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGifts, setEditingGifts] = useState<Record<string, number>>({});

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

  const handleGiftChange = (attendeeId: string, value: number) => {
    setEditingGifts(prev => ({
      ...prev,
      [attendeeId]: value
    }));
  };

  const handleUpdateGift = async (attendeeId: string, giftAmount: number) => {
    if (giftAmount < 0) return;
    try {
      await updateWeddingDayAttendee(attendeeId, { giftAmount });
      setEditingGifts(prev => {
        const newGifts = { ...prev };
        delete newGifts[attendeeId];
        return newGifts;
      });
      await loadAttendees();
    } catch (err) {
      setError('Failed to update gift amount');
      console.error(err);
    }
  };

  const participatedAttendees = [...attendees]
    .filter(a => a.attended)
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalGift = participatedAttendees.reduce(
    (sum, a) => sum + (editingGifts[a.id] ?? a.giftAmount ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading attendees...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to wedding day attendance"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Gift Tracking</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Total Gift Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <p className="text-green-100 text-sm font-medium mb-2">Total Gifts Received</p>
          <h2 className="text-5xl font-bold">Rs {totalGift.toFixed(2)}</h2>
          <p className="text-green-100 text-sm mt-2">From {participatedAttendees.length} attendees</p>
        </div>

        {/* Participated Attendees List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {participatedAttendees.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No participated attendees</h3>
              <p className="text-gray-500">
                Mark attendees as participated in the Wedding Day Attendance view to track their gifts.
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
                      Attendee Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gift Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participatedAttendees.map((attendee) => (
                    <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{attendee.actualCount} people</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Rs</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            title="Gift amount"
                            value={editingGifts[attendee.id] ?? attendee.giftAmount ?? 0}
                            onChange={(e) => handleGiftChange(attendee.id, parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleUpdateGift(attendee.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Section */}
        {participatedAttendees.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Total Attendees</p>
              <p className="text-3xl font-bold text-gray-900">{participatedAttendees.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Average Gift</p>
              <p className="text-3xl font-bold text-gray-900">
                Rs {(totalGift / participatedAttendees.length).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Gift Per Person</p>
              <p className="text-3xl font-bold text-gray-900">
                Rs {participatedAttendees.reduce((sum, a) => sum + a.actualCount, 0) > 0
                  ? (totalGift / participatedAttendees.reduce((sum, a) => sum + a.actualCount, 0)).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
