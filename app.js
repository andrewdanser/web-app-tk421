document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('githubToken');
    const fetchButton = document.getElementById('fetchStats');
    const downloadButton = document.getElementById('downloadExcel');
    const statsContainer = document.getElementById('statsContainer');
    let currentStats = null;
    let currentSeats = null;

    fetchButton.addEventListener('click', async () => {
        const token = tokenInput.value.trim();
        if (!token) {
            alert('Please enter your GitHub Personal Access Token');
            return;
        }

        try {
            const [stats, seats] = await Promise.all([
                fetchCopilotStats(token),
                fetchCopilotSeats(token)
            ]);
            currentStats = stats;
            currentSeats = seats;
            updateStatsDisplay(stats);
            updateSeatsDisplay(seats);
            downloadButton.disabled = false;
        } catch (error) {
            alert('Error fetching statistics: ' + error.message);
            downloadButton.disabled = true;
        }
    });

    downloadButton.addEventListener('click', () => {
        if (!currentStats || !currentSeats) return;
        downloadExcelReport(currentStats, currentSeats);
    });

    async function fetchCopilotStats(token) {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        const response = await fetch('https://api.github.com/orgs/MedMutual/copilot/metrics', {
            headers
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return await response.json();
    }

    async function fetchCopilotSeats(token) {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        const response = await fetch('https://api.github.com/orgs/MedMutual/copilot/billing/seats', {
            headers
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return await response.json();
    }

    function updateStatsDisplay(stats) {
        if (!stats || !stats.length) {
            console.error('No stats data available');
            return;
        }

        // Get the most recent day's stats
        const mostRecentStats = stats[0];
        console.log('Most recent stats:', mostRecentStats);

        // User Engagement
        document.getElementById('totalActiveUsers').textContent = mostRecentStats.total_active_users || '0';
        document.getElementById('totalEngagedUsers').textContent = mostRecentStats.total_engaged_users || '0';

        // IDE Code Completions
        document.getElementById('ideCodeCompletionsUsers').textContent = mostRecentStats.ide_code_completions?.total_engaged_users || '0';
        
        // Top Languages
        const topLanguages = mostRecentStats.ide_code_completions?.top_languages || [];
        const languagesList = topLanguages.slice(0, 3).map(lang => 
            `${lang.language}: ${lang.total_engaged_users} users`
        ).join('<br>');
        document.getElementById('topLanguages').innerHTML = languagesList || 'No data';

        // Top Editors
        const topEditors = mostRecentStats.ide_code_completions?.top_editors || [];
        const editorsList = topEditors.slice(0, 3).map(editor => 
            `${editor.editor}: ${editor.total_engaged_users} users`
        ).join('<br>');
        document.getElementById('topEditors').innerHTML = editorsList || 'No data';

        // IDE Chat
        document.getElementById('ideChatUsers').textContent = mostRecentStats.ide_chat?.total_engaged_users || '0';
        document.getElementById('totalChats').textContent = mostRecentStats.ide_chat?.total_chats || '0';
        document.getElementById('chatInsertions').textContent = mostRecentStats.ide_chat?.total_chat_insertions || '0';
    }

    function updateSeatsDisplay(seats) {
        // Update total seats
        document.getElementById('totalSeats').textContent = seats.total_seats || '0';

        // Sort users by last activity
        const activeUsers = seats.seats
            .filter(seat => seat.assignee && seat.last_activity_at)
            .sort((a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at));

        // Create HTML for active users list
        const activeUsersList = document.getElementById('activeUsersList');
        if (activeUsers.length === 0) {
            activeUsersList.innerHTML = 'No active users found';
            return;
        }

        activeUsersList.innerHTML = activeUsers.map(seat => {
            const user = seat.assignee;
            const lastActivity = new Date(seat.last_activity_at);
            const daysAgo = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="user-activity-item">
                    <div class="user-info">
                        <img src="${user.avatar_url}" alt="${user.login}" class="user-avatar">
                        <div>
                            <div class="user-login">${user.login}</div>
                            <div class="editor-info">${seat.last_activity_editor || 'No editor info'}</div>
                        </div>
                    </div>
                    <div class="last-activity">
                        ${daysAgo === 0 ? 'Today' : 
                          daysAgo === 1 ? 'Yesterday' : 
                          `${daysAgo} days ago`}
                    </div>
                </div>
            `;
        }).join('');
    }

    function downloadExcelReport(stats, seats) {
        if (!stats || !stats.length || !seats) {
            console.error('No data available for report');
            return;
        }

        const mostRecentStats = stats[0];
        const workbook = XLSX.utils.book_new();

        // Overview Sheet
        const overviewData = [
            ['GitHub Copilot Usage Report', ''],
            ['Generated Date', new Date().toLocaleString()],
            [''],
            ['User Engagement'],
            ['Total Active Users', mostRecentStats.total_active_users || 0],
            ['Total Engaged Users', mostRecentStats.total_engaged_users || 0],
            [''],
            ['IDE Code Completions'],
            ['Engaged Users', mostRecentStats.ide_code_completions?.total_engaged_users || 0],
            [''],
            ['Top Languages'],
            ...(mostRecentStats.ide_code_completions?.top_languages || []).map(lang => 
                [lang.language, lang.total_engaged_users]
            ),
            [''],
            ['Top Editors'],
            ...(mostRecentStats.ide_code_completions?.top_editors || []).map(editor => 
                [editor.editor, editor.total_engaged_users]
            ),
            [''],
            ['IDE Chat'],
            ['Engaged Users', mostRecentStats.ide_chat?.total_engaged_users || 0],
            ['Total Chats', mostRecentStats.ide_chat?.total_chats || 0],
            ['Code Insertions', mostRecentStats.ide_chat?.total_chat_insertions || 0],
            [''],
            ['User Activity'],
            ['Total Seats', seats.total_seats || 0],
            [''],
            ['Most Active Users'],
            ['Username', 'Last Editor', 'Last Activity'],
            ...seats.seats.slice(0, 10).map(seat => [
                seat.assignee?.login || 'Unassigned',
                seat.last_activity_editor || 'None',
                seat.last_activity_at ? new Date(seat.last_activity_at).toLocaleString() : 'Never'
            ])
        ];

        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

        // Historical Data Sheet
        const historicalData = stats.map(day => ({
            'Date': new Date(day.date).toLocaleDateString(),
            'Total Active Users': day.total_active_users || 0,
            'Total Engaged Users': day.total_engaged_users || 0,
            'IDE Code Completions Users': day.ide_code_completions?.total_engaged_users || 0,
            'IDE Chat Users': day.ide_chat?.total_engaged_users || 0,
            'Total Chats': day.ide_chat?.total_chats || 0,
            'Chat Insertions': day.ide_chat?.total_chat_insertions || 0
        }));

        const historicalSheet = XLSX.utils.json_to_sheet(historicalData);
        XLSX.utils.book_append_sheet(workbook, historicalSheet, 'Historical Data');

        // Download the file
        XLSX.writeFile(workbook, 'github_copilot_stats.xlsx');
    }
}); 