document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('githubToken');
    const fetchButton = document.getElementById('fetchStats');
    const downloadButton = document.getElementById('downloadExcel');
    const statsContainer = document.getElementById('statsContainer');
    let currentStats = null;

    fetchButton.addEventListener('click', async () => {
        const token = tokenInput.value.trim();
        if (!token) {
            alert('Please enter your GitHub Personal Access Token');
            return;
        }

        try {
            const stats = await fetchCopilotStats(token);
            currentStats = stats;
            updateStatsDisplay(stats);
            downloadButton.disabled = false;
        } catch (error) {
            alert('Error fetching statistics: ' + error.message);
            downloadButton.disabled = true;
        }
    });

    downloadButton.addEventListener('click', () => {
        if (!currentStats) return;
        downloadExcelReport(currentStats);
    });

    async function fetchCopilotStats(token) {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        // Fetch Copilot usage statistics
        const response = await fetch('https://api.github.com/orgs/MedMutual/copilot/metrics', {
            headers
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    function updateStatsDisplay(stats) {
        // Update last access time
        const lastAccessTime = document.getElementById('lastAccessTime');
        const lastAccess = new Date(stats.last_access_time);
        const daysSinceLastAccess = Math.floor((new Date() - lastAccess) / (1000 * 60 * 60 * 24));
        lastAccessTime.textContent = `${daysSinceLastAccess} days ago`;

        // Update total suggestions
        const totalSuggestions = document.getElementById('totalSuggestions');
        totalSuggestions.textContent = stats.total_suggestions || '0';

        // Update accepted suggestions
        const acceptedSuggestions = document.getElementById('acceptedSuggestions');
        acceptedSuggestions.textContent = stats.accepted_suggestions || '0';

        // Update acceptance rate
        const acceptanceRate = document.getElementById('acceptanceRate');
        const rate = stats.total_suggestions ? 
            ((stats.accepted_suggestions / stats.total_suggestions) * 100).toFixed(1) : '0';
        acceptanceRate.textContent = `${rate}%`;

        // Add warning if last access was more than 30 days ago
        if (daysSinceLastAccess > 30) {
            lastAccessTime.style.color = '#d73a49';
        } else {
            lastAccessTime.style.color = '#586069';
        }
    }

    function downloadExcelReport(stats) {
        // Create worksheet data
        const wsData = [
            ['GitHub Copilot Statistics Report'],
            ['Generated on', new Date().toLocaleString()],
            [],
            ['Metric', 'Value'],
            ['Last Access Time', new Date(stats.last_access_time).toLocaleString()],
            ['Days Since Last Access', Math.floor((new Date() - new Date(stats.last_access_time)) / (1000 * 60 * 60 * 24))],
            ['Total Suggestions', stats.total_suggestions || '0'],
            ['Accepted Suggestions', stats.accepted_suggestions || '0'],
            ['Acceptance Rate', stats.total_suggestions ? 
                `${((stats.accepted_suggestions / stats.total_suggestions) * 100).toFixed(1)}%` : '0%']
        ];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const wscols = [
            {wch: 25}, // Column A width
            {wch: 20}  // Column B width
        ];
        ws['!cols'] = wscols;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Copilot Stats');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `copilot-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}); 