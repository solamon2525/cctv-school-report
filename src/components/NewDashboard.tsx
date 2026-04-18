import React, { useState, useEffect } from 'react';
import { load, K, DutyReport, AppUser, School, today, fmtDate } from '../lib/store';
import CompletionCard from './CompletionCard';
import QuickStats from './QuickStats';
import TeacherStatusList from './TeacherStatusList';

interface Props {
  user: AppUser;
  schoolId: string;
}

export default function NewDashboard({ user, schoolId }: Props) {
  const [selectedDate, setSelectedDate] = useState(today());
  const allSchools = load<School>(K.schools);
  const allUsers = load<AppUser>(K.users);
  const allReports = load<DutyReport>(K.reports);

  // Get current school
  const currentSchool = allSchools.find(s => s.id === schoolId);

  // Filter reports for selected date and school
  const todayReports = allReports.filter(r => r.date === selectedDate && r.schoolId === schoolId);
  const yesterdayReports = allReports.filter(r => {
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return r.date === yesterday.toISOString().slice(0, 10) && r.schoolId === schoolId;
  });

  // Get all teachers for this school
  const schoolTeachers = allUsers.filter(u => u.role === 'teacher' && u.schoolId === schoolId);

  // Calculate completion stats
  const calculateCompletion = (reports: DutyReport[], shift: 'morning' | 'afternoon') => {
    const shiftReports = reports.filter(r => r.shift === shift);
    const hasReport = shiftReports.length > 0;
    const completed = shiftReports.length;
    const total = schoolTeachers.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Get pending teachers
    const reporterIds = new Set(shiftReports.map(r => r.reporterId));
    const pending = schoolTeachers
      .filter(t => !reporterIds.has(t.id))
      .map(t => t.name);

    return {
      percentage,
      completed,
      total,
      pending,
      hasReport,
    };
  };

  const morningCompletion = calculateCompletion(todayReports, 'morning');
  const afternoonCompletion = calculateCompletion(todayReports, 'afternoon');

  // Calculate stats for quick cards
  const todayIssues = todayReports.filter(r => !r.isNormal).length;
  const yesterdayIssues = yesterdayReports.filter(r => !r.isNormal).length;
  const issueChange = yesterdayIssues > 0 ? Math.round(((todayIssues - yesterdayIssues) / yesterdayIssues) * 100) : 0;

  const todayReportCount = todayReports.length;
  const yesterdayReportCount = yesterdayReports.length;
  const reportChange = yesterdayReportCount > 0 ? Math.round(((todayReportCount - yesterdayReportCount) / yesterdayReportCount) * 100) : 0;

  const totalPending = morningCompletion.pending.length + afternoonCompletion.pending.length;
  const pendingChange = 0; // Can be calculated if needed

  // Get teacher status lists
  const getMorningTeachers = () => {
    const shiftReports = todayReports.filter(r => r.shift === 'morning');
    const reporterMap = new Map(shiftReports.map(r => [r.reporterId, r.time]));

    return schoolTeachers.map(teacher => ({
      name: teacher.name,
      status: reporterMap.has(teacher.id) ? ('completed' as const) : ('pending' as const),
      time: reporterMap.get(teacher.id),
    }));
  };

  const getAfternoonTeachers = () => {
    const shiftReports = todayReports.filter(r => r.shift === 'afternoon');
    const reporterMap = new Map(shiftReports.map(r => [r.reporterId, r.time]));

    return schoolTeachers.map(teacher => ({
      name: teacher.name,
      status: reporterMap.has(teacher.id) ? ('completed' as const) : ('pending' as const),
      time: reporterMap.get(teacher.id),
    }));
  };

  // Get issues
  const todayIssuesList = todayReports
    .filter(r => !r.isNormal)
    .flatMap(r => r.areas.filter(a => a.status === 'issue').map(a => ({
      date: r.date,
      time: r.time,
      shift: r.shift,
      area: a.area,
      note: a.note,
      reporter: allUsers.find(u => u.id === r.reporterId)?.name || r.sign,
    })));

  // Date navigation
  const handlePrevDate = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev.toISOString().slice(0, 10));
  };

  const handleNextDate = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(today());
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with Date Navigation */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', margin: 0 }}>
            📊 แดชบอร์ด
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0 0' }}>
            {currentSchool?.name}
          </p>
        </div>

        {/* Date Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={handlePrevDate}
            style={{
              padding: '8px 12px',
              background: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
            }}
          >
            ◀ วันก่อน
          </button>

          <div style={{
            padding: '8px 16px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: '#1F2937',
            minWidth: 200,
            textAlign: 'center',
          }}>
            {new Date(selectedDate).toLocaleDateString('th-TH', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>

          <button
            onClick={handleToday}
            style={{
              padding: '8px 12px',
              background: '#3B82F6',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#FFF',
            }}
          >
            วันนี้
          </button>

          <button
            onClick={handleNextDate}
            style={{
              padding: '8px 12px',
              background: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
            }}
          >
            วันถัดไป ▶
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Completion Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          <CompletionCard
            shift="morning"
            percentage={morningCompletion.percentage}
            completed={morningCompletion.completed}
            total={morningCompletion.total}
            pending={morningCompletion.pending}
          />
          <CompletionCard
            shift="afternoon"
            percentage={afternoonCompletion.percentage}
            completed={afternoonCompletion.completed}
            total={afternoonCompletion.total}
            pending={afternoonCompletion.pending}
          />
        </div>

        {/* Quick Stats */}
        <QuickStats
          stats={[
            {
              icon: '📊',
              label: 'รายงานวันนี้',
              value: todayReportCount,
              change: reportChange,
              color: '#10B981',
              bgColor: '#F0FDF4',
            },
            {
              icon: '🚨',
              label: 'ปัญหาที่พบ',
              value: todayIssues,
              change: issueChange,
              color: '#EF4444',
              bgColor: '#FEF2F2',
            },
            {
              icon: '👥',
              label: 'ยังไม่รายงาน',
              value: totalPending,
              change: pendingChange,
              color: '#3B82F6',
              bgColor: '#EFF6FF',
            },
          ]}
        />

        {/* Teacher Status List */}
        <TeacherStatusList
          morning={getMorningTeachers()}
          afternoon={getAfternoonTeachers()}
        />

        {/* Issues Alert */}
        {todayIssuesList.length > 0 && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 12,
            padding: 16,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              fontSize: 14,
              fontWeight: 700,
              color: '#991B1B',
            }}>
              <span>🚨</span>
              <span>ปัญหาที่พบวันนี้ ({todayIssuesList.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayIssuesList.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>
                      {issue.area}
                    </span>
                    <span style={{ color: '#6B7280', fontSize: 11 }}>
                      {issue.time} น.
                    </span>
                  </div>
                  {issue.note && (
                    <div style={{ color: '#4B5563', marginBottom: 6 }}>
                      {issue.note}
                    </div>
                  )}
                  <div style={{ color: '#6B7280', fontSize: 11 }}>
                    ✍ {issue.reporter}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
