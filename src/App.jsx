import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Search, Briefcase, DollarSign, Building2, TrendingUp, Filter, LayoutGrid, List, X, ExternalLink } from 'lucide-react';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function App() {
  const [data, setData] = useState([]);
  const [jobsData, setJobsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [scaleFilter, setScaleFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('rank'); // rank, salary, employees

  // View state
  const [viewMode, setViewMode] = useState('grid');
  const [chartMetric, setChartMetric] = useState('salary');
  
  // Modal state
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    // Fetch CSV Data
    Papa.parse('./data.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map(item => ({
          ...item,
          rank: parseInt(item['순위']) || 9999,
          revenue: parseInt(item['2024년 매출(억원)']) || 0,
          employees: parseInt(item['직원수(공시)']) || 0,
          salary: parseInt(item['평균연봉(대표,만원)']) || 0,
        }));
        setData(parsedData);
        setLoading(false);
      }
    });

    // Fetch Jobs Data with cache busting
    fetch(`./jobs.json?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => setJobsData(data))
      .catch(err => {
        console.error("Error loading jobs.json:", err);
        setJobsData({}); // fallback to prevent infinite loading state
      });
  }, []);

  // Compute stats
  const totalCompanies = data.length;
  const avgSalary = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.salary, 0) / data.length) : 0;
  
  // Sectors for filter
  const sectors = ['All', ...new Set(data.map(item => item['섹터(추정)']).filter(Boolean))];
  const scales = ['All', ...new Set(data.map(item => item['채용규모(추정)']).filter(Boolean))];
  const types = ['All', ...new Set(data.map(item => item['채용형태(추정)']).filter(Boolean))];

  // Filtering
  const filteredData = data.filter(item => {
    const matchesSearch = item['기업명']?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item['IT/전산직 채용 및 주요 직무']?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'All' || item['섹터(추정)'] === sectorFilter;
    const matchesScale = scaleFilter === 'All' || item['채용규모(추정)'] === scaleFilter;
    const matchesType = typeFilter === 'All' || item['채용형태(추정)'] === typeFilter;
    
    return matchesSearch && matchesSector && matchesScale && matchesType;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'salary') return b.salary - a.salary;
    if (sortBy === 'employees') return b.employees - a.employees;
    return a.rank - b.rank; // rank (revenue)
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sectorFilter, scaleFilter, typeFilter, sortBy]);

  // Paginated Data
  const paginatedData = sortedData.slice(0, currentPage * itemsPerPage);
  const hasMore = paginatedData.length < sortedData.length;

  // Charts Data Prep
  const sectorCounts = data.reduce((acc, curr) => {
    const sector = curr['섹터(추정)'] || 'Unknown';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {});

  const scaleCounts = data.reduce((acc, curr) => {
    const scale = curr['채용규모(추정)'] || 'Unknown';
    acc[scale] = (acc[scale] || 0) + 1;
    return acc;
  }, {});

  let top10Data = [];
  let barChartLabel = '';
  let barDataField = '';
  
  if (chartMetric === 'salary') {
    top10Data = [...data].sort((a, b) => b.salary - a.salary).slice(0, 10);
    barChartLabel = 'Average Salary (만원)';
    barDataField = 'salary';
  } else if (chartMetric === 'revenue') {
    top10Data = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    barChartLabel = 'Revenue (억원)';
    barDataField = 'revenue';
  } else if (chartMetric === 'employees') {
    top10Data = [...data].sort((a, b) => b.employees - a.employees).slice(0, 10);
    barChartLabel = 'Employees';
    barDataField = 'employees';
  }

  const sectorChartData = {
    labels: Object.keys(sectorCounts),
    datasets: [{
      data: Object.values(sectorCounts),
      backgroundColor: [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', 
        '#eab308', '#10b981', '#14b8a6', '#06b6d4', '#64748b'
      ],
      borderWidth: 0,
    }]
  };

  const scaleChartData = {
    labels: Object.keys(scaleCounts),
    datasets: [{
      data: Object.values(scaleCounts),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'],
      borderWidth: 0,
    }]
  };

  const salaryChartData = {
    labels: top10Data.map(d => d['기업명']),
    datasets: [{
      label: barChartLabel,
      data: top10Data.map(d => d[barDataField]),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 4,
    }]
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: { color: '#f8fafc' },
        position: 'right',
      }
    },
    maintainAspectRatio: false,
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
    },
    maintainAspectRatio: false,
  };

  if (loading) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div className="header-title">
          <Briefcase size={32} color="#3b82f6" />
          <h1>Top 1000 Tech Jobs Dashboard</h1>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <Building2 size={16} /> <span>{totalCompanies} Companies</span>
          </div>
          <div className="stat-badge">
            <DollarSign size={16} /> <span>Avg Salary: {avgSalary.toLocaleString()}만원</span>
          </div>
        </div>
      </header>

      <div className="charts-grid">
        <div className="chart-card glass-panel">
          <h3>Sector Distribution</h3>
          <div className="chart-wrapper">
            <Doughnut data={sectorChartData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card glass-panel">
          <h3>Hiring Scale</h3>
          <div className="chart-wrapper">
            <Doughnut data={scaleChartData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card glass-panel bar-chart-card">
          <div className="chart-header-row">
            <h3>Top 10 Companies</h3>
            <div className="chart-metric-toggles">
              <button className={`metric-btn ${chartMetric === 'salary' ? 'active' : ''}`} onClick={() => setChartMetric('salary')}>Salary</button>
              <button className={`metric-btn ${chartMetric === 'revenue' ? 'active' : ''}`} onClick={() => setChartMetric('revenue')}>Revenue</button>
              <button className={`metric-btn ${chartMetric === 'employees' ? 'active' : ''}`} onClick={() => setChartMetric('employees')}>Employees</button>
            </div>
          </div>
          <div className="chart-wrapper">
            <Bar data={salaryChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      <div className="controls-section glass-panel">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search companies, roles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <Filter size={16} color="#94a3b8" />
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select value={scaleFilter} onChange={(e) => setScaleFilter(e.target.value)}>
              {scales.map(s => <option key={s} value={s}>Scale: {s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {types.map(t => <option key={t} value={t}>Type: {t}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <TrendingUp size={16} color="#94a3b8" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rank">Sort by Rank / Revenue</option>
              <option value="salary">Sort by Salary</option>
              <option value="employees">Sort by Employees</option>
            </select>
          </div>
          <div className="view-toggles">
            <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View">
              <LayoutGrid size={18} />
            </button>
            <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table View">
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="companies-grid">
          {paginatedData.map((company, index) => (
            <div key={index} className="company-card glass-panel" onClick={() => setSelectedCompany(company)}>
              <div className="company-header">
                <div className="company-title-wrap">
                  <span className="rank-badge">#{company.rank}</span>
                  <h2>{company['기업명']}</h2>
                </div>
                <span className="sector-tag">{company['섹터(추정)']}</span>
              </div>
              
              <div className="company-details">
                <div className="detail-row">
                  <span className="detail-label">Salary:</span>
                  <span className="detail-value highlight">{company.salary.toLocaleString()} 만원</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Revenue:</span>
                  <span className="detail-value">{company.revenue.toLocaleString()} 억원</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Employees:</span>
                  <span className="detail-value">{company.employees.toLocaleString()}</span>
                </div>
                <div className="detail-row mt-2">
                  <span className="detail-label">Hiring:</span>
                  <span className="detail-value tags">
                    {company['채용규모(추정)'] && <span className="tag scale">{company['채용규모(추정)']}</span>}
                    {company['채용형태(추정)'] && <span className="tag type">{company['채용형태(추정)']}</span>}
                  </span>
                </div>
              </div>

              <div className="company-roles">
                <h4>IT Roles & Focus</h4>
                <p>{company['IT/전산직 채용 및 주요 직무'] || 'N/A'}</p>
              </div>
              
              <div className="company-notes">
                <p>{company['비고 및 특이사항']}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="companies-table-container glass-panel">
          <table className="companies-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Company</th>
                <th>Sector</th>
                <th>Salary (만원)</th>
                <th>Revenue (억원)</th>
                <th>Employees</th>
                <th>Hiring Scale</th>
                <th>Hiring Type</th>
                <th>IT Roles</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((company, index) => (
                <tr key={index} onClick={() => setSelectedCompany(company)}>
                  <td>#{company.rank}</td>
                  <td className="fw-600">{company['기업명']}</td>
                  <td><span className="sector-tag">{company['섹터(추정)']}</span></td>
                  <td className="highlight">{company.salary.toLocaleString()}</td>
                  <td>{company.revenue.toLocaleString()}</td>
                  <td>{company.employees.toLocaleString()}</td>
                  <td>{company['채용규모(추정)']}</td>
                  <td>{company['채용형태(추정)']}</td>
                  <td className="text-small">{company['IT/전산직 채용 및 주요 직무']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="load-more-container">
          <button 
            className="load-more-btn"
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Load More Companies ({sortedData.length - paginatedData.length} remaining)
          </button>
        </div>
      )}

      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedCompany(null)}>
              <X size={24} />
            </button>
            <div className="modal-header">
              <span className="rank-badge">#{selectedCompany.rank}</span>
              <h2>{selectedCompany['기업명']}</h2>
              <span className="sector-tag">{selectedCompany['섹터(추정)']}</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h3>Quick Search Links</h3>
                <div className="quick-links">
                  <a href={`https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(selectedCompany['기업명'])}`} target="_blank" rel="noreferrer" className="quick-link-btn naver">
                    <ExternalLink size={16} /> Naver News
                  </a>
                  <a href={`https://www.jobkorea.co.kr/Search/?stext=${encodeURIComponent(selectedCompany['기업명'])}`} target="_blank" rel="noreferrer" className="quick-link-btn jobkorea">
                    <ExternalLink size={16} /> JobKorea
                  </a>
                  <a href={`https://dart.fss.or.kr/dsab001/main.do?textCrpNm=${encodeURIComponent(selectedCompany['기업명'])}`} target="_blank" rel="noreferrer" className="quick-link-btn dart">
                    <ExternalLink size={16} /> DART (공시)
                  </a>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(selectedCompany['기업명'] + ' 채용')}`} target="_blank" rel="noreferrer" className="quick-link-btn google">
                    <ExternalLink size={16} /> Google Search
                  </a>
                </div>
              </div>

              <div className="modal-section">
                <h3>Company Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Avg Salary</span>
                    <span className="value highlight">{selectedCompany.salary.toLocaleString()} 만원</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Revenue</span>
                    <span className="value">{selectedCompany.revenue.toLocaleString()} 억원</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Employees</span>
                    <span className="value">{selectedCompany.employees.toLocaleString()} 명</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Hiring Scale</span>
                    <span className="value">{selectedCompany['채용규모(추정)'] || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Hiring Type</span>
                    <span className="value">{selectedCompany['채용형태(추정)'] || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>IT Roles & Focus</h3>
                <p className="role-text">{selectedCompany['IT/전산직 채용 및 주요 직무'] || 'N/A'}</p>
              </div>

              <div className="modal-section">
                <h3>Notes / Remarks</h3>
                <p className="notes-text">{selectedCompany['비고 및 특이사항']}</p>
              </div>

              <div className="modal-section">
                <h3>Recent Job Postings (Saramin)</h3>
                {jobsData[selectedCompany['기업명']] ? (
                  jobsData[selectedCompany['기업명']].length > 0 ? (
                    <div className="jobs-list">
                      {jobsData[selectedCompany['기업명']].map((job, idx) => (
                        <div key={idx} className="job-card glass-panel">
                          <a href={job.link} target="_blank" rel="noreferrer" className="job-title-link">
                            <h4>{job.title}</h4>
                            <ExternalLink size={14} className="job-link-icon"/>
                          </a>
                          <div className="job-details">
                            <span className="job-company">{job.company}</span>
                            <span className="job-conditions">{job.conditions}</span>
                            <span className="job-deadline">{job.deadline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-jobs">현재 채용 중인 공고가 없습니다.</p>
                  )
                ) : (
                  <p className="loading-jobs">채용 공고 정보를 불러오는 중입니다...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
