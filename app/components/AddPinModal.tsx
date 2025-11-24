'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HelpRequestInput, UserLocation } from '../types';
import { saveUserPin } from '../lib/pinStorage';

const DraggablePinMap = dynamic(() => import('./DraggablePinMap'), {
  ssr: false,
});

interface AddPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation | null;
  onSuccess: () => void;
}

export default function AddPinModal({ isOpen, onClose, userLocation, onSuccess }: AddPinModalProps) {
  const [formData, setFormData] = useState({
    place_name: '',
    phone: '',
    backup_phone: '',
    num_people: '',
    has_elderly: false,
    has_children: false,
    has_sick: false,
    has_pets: false,
    additional_message: '',
  });
  
  const [pinLocation, setPinLocation] = useState<UserLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userLocation) {
      setPinLocation(userLocation);
    }
  }, [isOpen, userLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pinLocation) {
      setError('กรุณาเลือกตำแหน่งบนแผนที่');
      return;
    }

    if (!formData.phone) {
      setError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: HelpRequestInput = {
        ...formData,
        latitude: pinLocation.latitude,
        longitude: pinLocation.longitude,
      };

      const response = await fetch('/api/help-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create help request');
      }

      const result = await response.json();
      
      // Save pin ID to localStorage
      if (result.id) {
        saveUserPin(result.id);
      }

      // Reset form
      setFormData({
        place_name: '',
        phone: '',
        backup_phone: '',
        num_people: '',
        has_elderly: false,
        has_children: false,
        has_sick: false,
        has_pets: false,
        additional_message: '',
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      console.error('Error submitting help request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationChange = (newLocation: UserLocation) => {
    setPinLocation(newLocation);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">ขอความช่วยเหลือ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Place Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อสถานที่
            </label>
            <input
              type="text"
              value={formData.place_name}
              onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="เช่น บ้านเลขที่ 123, หมู่บ้านสุขสันต์"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทร <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="0812345678"
              required
            />
          </div>

          {/* Backup Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์ติดต่อสำรอง
            </label>
            <input
              type="tel"
              value={formData.backup_phone}
              onChange={(e) => setFormData({ ...formData, backup_phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="0898765432"
            />
          </div>

          {/* Number of People */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวนคนที่ต้องการช่วยเหลือ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.num_people}
              onChange={(e) => setFormData({ ...formData, num_people: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="เช่น 3 คน หรือ 3-4 คน"
              required
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 py-2">
              <input
                type="checkbox"
                checked={formData.has_elderly}
                onChange={(e) => setFormData({ ...formData, has_elderly: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">มีคนแก่</span>
            </label>
            
            <label className="flex items-center space-x-3 py-2">
              <input
                type="checkbox"
                checked={formData.has_children}
                onChange={(e) => setFormData({ ...formData, has_children: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">มีเด็ก</span>
            </label>
            
            <label className="flex items-center space-x-3 py-2">
              <input
                type="checkbox"
                checked={formData.has_sick}
                onChange={(e) => setFormData({ ...formData, has_sick: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">มีคนป่วย</span>
            </label>
            
            <label className="flex items-center space-x-3 py-2">
              <input
                type="checkbox"
                checked={formData.has_pets}
                onChange={(e) => setFormData({ ...formData, has_pets: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">มีสัตว์เลี้ยง</span>
            </label>
          </div>

          {/* Additional Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ข้อความเพิ่มเติม
            </label>
            <textarea
              value={formData.additional_message}
              onChange={(e) => setFormData({ ...formData, additional_message: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              rows={3}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
            />
          </div>

          {/* Location Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ตำแหน่งที่ต้องการความช่วยเหลือ
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="mb-1">📍 ลากพินหรือแตะบนแผนที่ด้านล่างเพื่อปรับตำแหน่ง</p>
              {pinLocation && (
                <p className="text-xs text-blue-600 font-mono">
                  {pinLocation.latitude.toFixed(6)}, {pinLocation.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Draggable Map for Pin Placement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แผนที่ (ลากพินเพื่อปรับตำแหน่ง)
            </label>
            <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-300 relative">
              {pinLocation && (
                <DraggablePinMap 
                  location={pinLocation} 
                  onLocationChange={handleLocationChange}
                />
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 min-h-[44px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'ส่งคำขอ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

