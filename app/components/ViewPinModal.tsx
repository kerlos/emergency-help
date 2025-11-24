'use client';

import { useState } from 'react';
import { HelpRequest } from '../types';
import { isUserPin, removeUserPin } from '../lib/pinStorage';

interface ViewPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  helpRequest: HelpRequest | null;
  onUpdate: () => void;
}

export default function ViewPinModal({ isOpen, onClose, helpRequest, onUpdate }: ViewPinModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !helpRequest) return null;

  const isOwner = isUserPin(helpRequest.id);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/help-requests/${helpRequest.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      removeUserPin(helpRequest.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting help request:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMarkAsHelped = async () => {
    setIsMarking(true);
    try {
      const response = await fetch(`/api/help-requests/${helpRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating help request:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
    } finally {
      setIsMarking(false);
    }
  };

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
          <h2 className="text-xl font-semibold text-gray-900">รายละเอียดคำขอความช่วยเหลือ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Place Name */}
          {helpRequest.place_name && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">ชื่อสถานที่</label>
              <p className="text-lg font-semibold text-gray-900">{helpRequest.place_name}</p>
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">เบอร์โทร</label>
            <a 
              href={`tel:${helpRequest.phone}`}
              className="text-lg font-semibold text-blue-600 hover:underline"
            >
              {helpRequest.phone}
            </a>
          </div>

          {/* Backup Phone */}
          {helpRequest.backup_phone && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">เบอร์ติดต่อสำรอง</label>
              <a 
                href={`tel:${helpRequest.backup_phone}`}
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {helpRequest.backup_phone}
              </a>
            </div>
          )}

          {/* Number of People */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">จำนวนคน</label>
            <p className="text-lg font-semibold text-gray-900">{helpRequest.num_people}</p>
          </div>

          {/* Conditions */}
          {(helpRequest.has_elderly || helpRequest.has_children || helpRequest.has_sick || helpRequest.has_pets) && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">สภาพผู้ต้องการความช่วยเหลือ</label>
              <div className="space-y-1">
                {helpRequest.has_elderly && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">มีคนแก่</span>
                  </div>
                )}
                {helpRequest.has_children && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">มีเด็ก</span>
                  </div>
                )}
                {helpRequest.has_sick && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">มีคนป่วย</span>
                  </div>
                )}
                {helpRequest.has_pets && (
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">มีสัตว์เลี้ยง</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Message */}
          {helpRequest.additional_message && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">ข้อความเพิ่มเติม</label>
              <p className="text-gray-700 whitespace-pre-wrap">{helpRequest.additional_message}</p>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">ตำแหน่ง</label>
            <a
              href={`https://www.google.com/maps?q=${helpRequest.latitude},${helpRequest.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              เปิดใน Google Maps
            </a>
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">เวลาที่ส่งคำขอ</label>
            <p className="text-sm text-gray-700">
              {new Date(helpRequest.created_at).toLocaleString('th-TH')}
            </p>
          </div>

          {/* Action Buttons for Owner */}
          {isOwner && (
            <div className="pt-4 space-y-3">
              <button
                onClick={handleMarkAsHelped}
                disabled={isMarking}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 min-h-[44px]"
              >
                {isMarking ? 'กำลังอัพเดท...' : 'ช่วยเหลือแล้ว'}
              </button>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 min-h-[44px]"
                >
                  ลบ
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 text-center font-medium">
                    คุณแน่ใจหรือไม่ที่จะลบคำขอนี้?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 min-h-[44px]"
                    >
                      {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Close Button for Non-Owner */}
          {!isOwner && (
            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
              >
                ปิด
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

