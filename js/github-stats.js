// GitHub Stats Integration
class GitHubStats {
    constructor(username) {
        this.username = username;
        this.statsContainer = document.querySelector('.stats-grid');
        this.init();
    }

    async init() {
        try {
            const stats = await this.fetchGitHubStats();
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error fetching GitHub stats:', error);
            this.showError();
        }
    }

    async fetchGitHubStats() {
        const response = await fetch(`https://api.github.com/users/${this.username}`);
        if (!response.ok) {
            throw new Error('Failed to fetch GitHub stats');
        }
        const data = await response.json();
        
        // Fetch additional stats
        const reposResponse = await fetch(`https://api.github.com/users/${this.username}/repos`);
        const reposData = await reposResponse.json();
        
        // Calculate total stars
        const totalStars = reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        
        // Get contribution data
        const contributionsResponse = await fetch(`https://api.github.com/users/${this.username}/events`);
        const contributionsData = await contributionsResponse.json();
        
        return {
            publicRepos: data.public_repos,
            followers: data.followers,
            totalStars: totalStars,
            contributions: contributionsData.length
        };
    }

    updateStatsDisplay(stats) {
        if (!this.statsContainer) return;

        const statsHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.totalStars}</div>
                <div class="stat-label">Total Stars</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.publicRepos}</div>
                <div class="stat-label">Public Repos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.followers}</div>
                <div class="stat-label">Followers</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.contributions}</div>
                <div class="stat-label">Contributions</div>
            </div>
        `;

        this.statsContainer.innerHTML = statsHTML;
    }

    showError() {
        if (!this.statsContainer) return;
        
        this.statsContainer.innerHTML = `
            <div class="stat-card error">
                <div class="stat-number"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="stat-label">Unable to load stats</div>
            </div>
        `;
    }
}

// Initialize GitHub stats when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    const githubUsername = 'ChristopherJoshy'; // Your GitHub username
    new GitHubStats(githubUsername);
}); 