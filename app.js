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
        // Get the most recent day's stats
        const latestStats = stats[0];

        // User Engagement
        document.getElementById('totalActiveUsers').textContent = latestStats.total_active_users || '0';
        document.getElementById('totalEngagedUsers').textContent = latestStats.total_engaged_users || '0';

        // IDE Code Completions
        if (latestStats.copilot_ide_code_completions) {
            document.getElementById('ideCodeCompletionsUsers').textContent = 
                latestStats.copilot_ide_code_completions.total_engaged_users || '0';

            // Top Languages
            const languages = latestStats.copilot_ide_code_completions.languages || [];
            const topLanguages = languages
                .sort((a, b) => b.total_engaged_users - a.total_engaged_users)
                .slice(0, 3)
                .map(lang => `${lang.name}: ${lang.total_engaged_users} users`)
                .join('<br>');
            document.getElementById('topLanguages').innerHTML = topLanguages || 'No data';

            // Top Editors
            const editors = latestStats.copilot_ide_code_completions.editors || [];
            const topEditors = editors
                .sort((a, b) => b.total_engaged_users - a.total_engaged_users)
                .slice(0, 3)
                .map(editor => `${editor.name}: ${editor.total_engaged_users} users`)
                .join('<br>');
            document.getElementById('topEditors').innerHTML = topEditors || 'No data';
        }

        // IDE Chat
        if (latestStats.copilot_ide_chat) {
            document.getElementById('ideChatUsers').textContent = 
                latestStats.copilot_ide_chat.total_engaged_users || '0';

            // Calculate total chats and insertions across all editors and models
            let totalChats = 0;
            let totalInsertions = 0;
            latestStats.copilot_ide_chat.editors?.forEach(editor => {
                editor.models?.forEach(model => {
                    totalChats += model.total_chats || 0;
                    totalInsertions += model.total_chat_insertion_events || 0;
                });
            });
            document.getElementById('totalChats').textContent = totalChats;
            document.getElementById('chatInsertions').textContent = totalInsertions;
        }

        // GitHub.com Chat
        if (latestStats.copilot_dotcom_chat) {
            document.getElementById('dotcomChatUsers').textContent = 
                latestStats.copilot_dotcom_chat.total_engaged_users || '0';

            // Calculate total chats across all models
            const totalChats = latestStats.copilot_dotcom_chat.models?.reduce(
                (sum, model) => sum + (model.total_chats || 0), 0
            ) || 0;
            document.getElementById('dotcomTotalChats').textContent = totalChats;
        }

        // Pull Requests
        if (latestStats.copilot_dotcom_pull_requests) {
            document.getElementById('prEngagedUsers').textContent = 
                latestStats.copilot_dotcom_pull_requests.total_engaged_users || '0';

            // Calculate total PR summaries across all repositories and models
            let totalSummaries = 0;
            latestStats.copilot_dotcom_pull_requests.repositories?.forEach(repo => {
                repo.models?.forEach(model => {
                    totalSummaries += model.total_pr_summaries_created || 0;
                });
            });
            document.getElementById('prSummaries').textContent = totalSummaries;
        }
    }

    function downloadExcelReport(stats) {
        const latestStats = stats[0];
        const wsData = [
            ['GitHub Copilot Statistics Report'],
            ['Generated on', new Date().toLocaleString()],
            ['Date', latestStats.date],
            [],
            ['User Engagement'],
            ['Total Active Users', latestStats.total_active_users || '0'],
            ['Total Engaged Users', latestStats.total_engaged_users || '0'],
            [],
            ['IDE Code Completions'],
            ['Total Engaged Users', latestStats.copilot_ide_code_completions?.total_engaged_users || '0'],
            [],
            ['Top Languages'],
            ...(latestStats.copilot_ide_code_completions?.languages || [])
                .sort((a, b) => b.total_engaged_users - a.total_engaged_users)
                .slice(0, 5)
                .map(lang => [lang.name, lang.total_engaged_users]),
            [],
            ['Top Editors'],
            ...(latestStats.copilot_ide_code_completions?.editors || [])
                .sort((a, b) => b.total_engaged_users - a.total_engaged_users)
                .slice(0, 5)
                .map(editor => [editor.name, editor.total_engaged_users]),
            [],
            ['IDE Chat'],
            ['Total Engaged Users', latestStats.copilot_ide_chat?.total_engaged_users || '0'],
            ['Total Chats', latestStats.copilot_ide_chat?.editors?.reduce(
                (sum, editor) => sum + (editor.models?.reduce(
                    (modelSum, model) => modelSum + (model.total_chats || 0), 0
                ) || 0), 0
            ) || '0'],
            [],
            ['GitHub.com Chat'],
            ['Total Engaged Users', latestStats.copilot_dotcom_chat?.total_engaged_users || '0'],
            ['Total Chats', latestStats.copilot_dotcom_chat?.models?.reduce(
                (sum, model) => sum + (model.total_chats || 0), 0
            ) || '0'],
            [],
            ['Pull Requests'],
            ['Total Engaged Users', latestStats.copilot_dotcom_pull_requests?.total_engaged_users || '0'],
            ['Total PR Summaries', latestStats.copilot_dotcom_pull_requests?.repositories?.reduce(
                (sum, repo) => sum + (repo.models?.reduce(
                    (modelSum, model) => modelSum + (model.total_pr_summaries_created || 0), 0
                ) || 0), 0
            ) || '0']
        ];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const wscols = [
            {wch: 30}, // Column A width
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
        a.download = `copilot-stats-${latestStats.date}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}); 