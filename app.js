document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('githubToken');
    const fetchButton = document.getElementById('fetchStats');
    const statsContainer = document.getElementById('statsContainer');

    fetchButton.addEventListener('click', async () => {
        const token = tokenInput.value.trim();
        if (!token) {
            alert('Please enter your GitHub Personal Access Token');
            return;
        }

        try {
            const stats = await fetchCopilotStats(token);
            updateStatsDisplay(stats);
        } catch (error) {
            alert('Error fetching statistics: ' + error.message);
        }
    });

    async function fetchCopilotStats(token) {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        // Fetch Copilot usage statistics
        const response = await fetch('https://api.github.com/user/copilot/usage', {
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
}); 