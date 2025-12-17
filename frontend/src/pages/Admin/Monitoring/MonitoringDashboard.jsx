// src/pages/Admin/Monitoring/MonitoringDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Cpu,
  Layers,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import  monitoringService  from '../../../services/monitoring';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const MonitoringDashboard = () => {
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Fetch system status
  const { data: systemStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: monitoringService.getSystemStatus,
    refetchInterval: refreshInterval * 1000
  });

  // Fetch performance metrics
  const { data: performance } = useQuery({
    queryKey: ['performance-metrics', selectedTimeRange],
    queryFn: () => monitoringService.getPerformanceMetrics(selectedTimeRange)
  });

  // Fetch alerts
  const { data: alerts } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: monitoringService.getSystemAlerts
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Minus className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const systemMetrics = [
    {
      name: 'CPU Usage',
      value: `${performance?.cpuUsage || 0}%`,
      change: performance?.cpuChange || 0,
      icon: Cpu,
      status: systemStatus?.cpuStatus || 'healthy'
    },
    {
      name: 'Memory Usage',
      value: `${performance?.memoryUsage || 0}%`,
      change: performance?.memoryChange || 0,
      icon: Layers,
      status: systemStatus?.memoryStatus || 'healthy'
    },
    {
      name: 'Disk Usage',
      value: `${performance?.diskUsage || 0}%`,
      change: performance?.diskChange || 0,
      icon: Layers,
      status: systemStatus?.diskStatus || 'healthy'
    },
    {
      name: 'Response Time',
      value: `${performance?.responseTime || 0}ms`,
      change: performance?.responseTimeChange || 0,
      icon: Clock,
      status: systemStatus?.responseTimeStatus || 'healthy'
    }
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load monitoring data" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Monitoring</h1>
            <p className="text-gray-600">Monitor system health and performance in real-time</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
            
            <button
              onClick={() => refetchStatus()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {systemMetrics.map((metric) => (
          <div key={metric.name} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${getStatusColor(metric.status)}`}>
                <metric.icon className="h-6 w-6" />
              </div>
              {getStatusIcon(metric.status)}
            </div>
            
            <div className="mb-2">
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.name}</p>
            </div>
            
            {metric.change !== 0 && (
              <div className={`flex items-center text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(metric.change)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* CPU Usage Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Usage Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            <Cpu className="h-12 w-12 mr-2" />
            CPU Usage Chart Placeholder
          </div>
        </div>

        {/* Memory Usage Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            <Layers className="h-12 w-12 mr-2" />
            Memory Usage Chart Placeholder
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
        
        <div className="space-y-3">
          {alerts?.map((alert) => (
            <div
              key={alert._id}
              className={`flex items-center gap-3 p-4 rounded-lg ${
                alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                alert.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-green-50 border border-green-200'
              }`}
            >
              {getStatusIcon(alert.severity)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{alert.title}</h4>
                <p className="text-sm text-gray-600">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          
          {(!alerts || alerts.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active alerts</p>
              <p className="text-sm">System is running smoothly</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Connection Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                systemStatus?.databaseStatus === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemStatus?.databaseStatus || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Query Response Time</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.dbResponseTime || 0}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.activeConnections || 0}
              </span>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.apiResponseTime || 0}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.errorRate || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.uptime || '99.9%'}
              </span>
            </div>
          </div>
        </div>

        {/* Server Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Server Load</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.serverLoad || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disk Space</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.diskUsage || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <span className="text-sm font-medium text-gray-900">
                {systemStatus?.memoryUsage || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;