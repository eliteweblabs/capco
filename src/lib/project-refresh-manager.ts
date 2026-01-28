/**
 * ProjectRefreshManager
 * 
 * ⚠️ DEPRECATED - DO NOT USE ⚠️
 * This polling system has been replaced by the generic refresh-manager.ts
 * 
 * This file is kept for reference only. It was causing excessive database
 * queries (4,320 queries per day with just one developer working 12 hours).
 * 
 * Use src/lib/refresh-manager.ts instead, which:
 * - Uses longer intervals (30s instead of 10s)
 * - Is more flexible and reusable
 * - Properly groups API calls
 * 
 * Polls the database at regular intervals to keep project data fresh
 * across multiple users. Handles both automatic scanning and manual updates.
 */

class ProjectRefreshManager {
  constructor(options = {}) {
    this.interval = options.interval || 10000; // Default 10 seconds (increased from 5s)
    this.intervalId = null;
    this.isRunning = false;
    this.lastPoll = null;
    this.projectCache = new Map(); // Cache of project data by ID
    this.pausedProjects = new Set(); // Track projects that are being edited
    
    // Inactivity settings
    this.inactivityTimeout = options.inactivityTimeout || 60000; // Default 1 minute
    this.lastActivity = Date.now();
    this.isPaused = false;
    this.inactivityTimer = null;
    
    console.log('📊 [REFRESH] ProjectRefreshManager initialized with', options);
    
    // Set up activity listeners
    this.setupActivityListeners();
  }
  
  /**
   * Setup listeners for user activity
   */
  setupActivityListeners() {
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.handleActivity(), { passive: true });
    });
    
    console.log('📊 [REFRESH] Activity listeners setup');
  }
  
  /**
   * Handle user activity
   */
  handleActivity() {
    this.lastActivity = Date.now();
    
    // If paused, resume
    if (this.isPaused) {
      console.log('📊 [REFRESH] Activity detected, resuming polling');
      this.isPaused = false;
      this.hideOverlay();
      
      if (!this.isRunning) {
        this.start();
      }
    }
    
    // Reset inactivity timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    // Set new inactivity timer
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.inactivityTimeout);
  }
  
  /**
   * Handle inactivity timeout
   */
  handleInactivity() {
    console.log('📊 [REFRESH] Inactivity detected, pausing polling');
    this.isPaused = true;
    this.stop();
    this.showOverlay();
  }
  
  /**
   * Show pause overlay
   */
  showOverlay() {
    // Check if overlay already exists
    if (document.getElementById('refresh-pause-overlay')) {
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'refresh-pause-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(147, 51, 234, 0.95) 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        animation: slideDown 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <svg style="width: 20px; height: 20px; animation: pulse 2s ease-in-out infinite;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          <span style="font-size: 14px; font-weight: 500;">
            Auto-refresh paused • Move your mouse to resume
          </span>
        </div>
      </div>
      <style>
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      </style>
    `;
    
    document.body.appendChild(overlay);
    console.log('📊 [REFRESH] Overlay shown');
  }
  
  /**
   * Hide pause overlay
   */
  hideOverlay() {
    const overlay = document.getElementById('refresh-pause-overlay');
    if (overlay) {
      overlay.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => {
        overlay.remove();
        console.log('📊 [REFRESH] Overlay hidden');
      }, 300);
    }
  }

  /**
   * Start polling for updates
   */
  start() {
    if (this.isRunning) {
      console.log('📊 [REFRESH] Already running');
      return;
    }

    console.log('📊 [REFRESH] Starting refresh polling every', this.interval, 'ms');
    this.isRunning = true;
    this.isPaused = false;
    
    // Wait 5 seconds before first scan to ensure auth is fully ready
    console.log('📊 [REFRESH] Waiting 5 seconds for authentication to be ready...');
    setTimeout(() => {
      this.refresh();
    }, 5000);
    
    // Set up interval (starts after first refresh completes)
    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.refresh();
      }
    }, this.interval);
    
    // Start inactivity timer
    this.handleActivity();
  }

  /**
   * Stop polling
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('📊 [REFRESH] Stopping refresh polling');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Scan the page for elements that need refreshing
   */
  scanPage() {
    const elements = document.querySelectorAll('[data-refresh="true"][data-project-id]');
    const projectIds = new Set();

    elements.forEach(element => {
      const projectId = element.getAttribute('data-project-id');
      if (projectId) {
        projectIds.add(parseInt(projectId));
      }
    });

    console.log('📊 [REFRESH] Found', projectIds.size, 'unique projects to refresh');
    return Array.from(projectIds);
  }

  /**
   * Fetch fresh data from the API
   */
  async fetchProjects(projectIds) {
    if (!projectIds || projectIds.length === 0) {
      return [];
    }

    // Limit to max 50 projects per request to avoid overload
    if (projectIds.length > 50) {
      console.warn('📊 [REFRESH] Too many projects, limiting to first 50');
      projectIds = projectIds.slice(0, 50);
    }

    try {
      const response = await fetch('/api/projects/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ projectIds }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📊 [REFRESH] API returned error:', response.status, response.statusText, errorText);
        
        // If unauthorized, stop trying
        if (response.status === 401) {
          console.error('📊 [REFRESH] Not authenticated, stopping refresh manager');
          this.stop();
          return [];
        }
        
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.projects) {
        return result.projects;
      }

      console.warn('📊 [REFRESH] API returned no projects:', result);
      return [];
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.error('📊 [REFRESH] Request timeout - server may be overloaded');
      } else {
        console.error('📊 [REFRESH] Error fetching projects:', error);
      }
      return [];
    }
  }

  /**
   * Update DOM elements with fresh data
   */
  updateElement(element, project) {
    const metaName = element.getAttribute('data-meta');
    const oldValue = element.getAttribute('data-meta-value');
    
    if (!metaName) {
      return false;
    }

    // CRITICAL: Don't update if element is currently being edited/saved
    if (element.classList.contains('saving') || element.classList.contains('saved')) {
      console.log('📊 [REFRESH] Skipping update for', metaName, '- element is being saved');
      return false;
    }

    let newValue = project[metaName];
    
    // Skip if value doesn't exist in project data
    if (newValue === undefined) {
      return false;
    }
    
    // For number inputs, convert null to 0
    const isNumberInput = element.type === 'number';
    if (isNumberInput && (newValue === null || newValue === '')) {
      newValue = 0;
    }
    
    // Convert to string for comparison
    const newValueStr = String(newValue);
    const oldValueStr = String(oldValue);

    // Skip update if values are the same (no change needed)
    if (newValueStr === oldValueStr) {
      return false;
    }
    
    console.log('📊 [REFRESH] Updating', metaName, 'from', oldValueStr, 'to', newValueStr);
    
    // Update the data attribute
    element.setAttribute('data-meta-value', newValueStr);
    
    // Check if it's an input element or text element
    const isInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
    
    // Prepare display value
    let displayValue = newValueStr;
      
      // Special formatting for updatedAt
      if (metaName === 'updatedAt' && newValueStr) {
        const now = new Date();
        const updated = new Date(newValueStr);
        const diffMs = now.getTime() - updated.getTime();
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) {
          displayValue = `${years} year${years > 1 ? "s" : ""} ago`;
        } else if (months > 0) {
          displayValue = `${months} month${months > 1 ? "s" : ""} ago`;
        } else if (weeks > 0) {
          displayValue = `${weeks} week${weeks > 1 ? "s" : ""} ago`;
        } else if (days > 0) {
          displayValue = `${days} day${days > 1 ? "s" : ""} ago`;
        } else if (hours > 0) {
          displayValue = `${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else if (minutes > 0) {
          displayValue = `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else {
          displayValue = "Just now";
        }
      }
      
      // Special formatting for dueDate
      if (metaName === 'dueDate' && newValueStr && isInput) {
        displayValue = new Date(newValueStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          hour12: true,
        });
      }
      
      // Apply slide animation
      element.style.position = 'relative';
      element.style.overflow = 'hidden';
    
    // Slide out old value (down)
    element.style.transform = 'translateY(100%)';
    element.style.opacity = '0';
    element.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
      // Update the value/content with formatted display value
      if (isInput) {
        element.value = displayValue;
        // Also update data-due-date for date inputs
        if (metaName === 'dueDate') {
          element.setAttribute('data-due-date', newValueStr);
        }
      } else {
        element.textContent = displayValue;
      }
      
      // Reset position to slide in from top
      element.style.transition = 'none';
      element.style.transform = 'translateY(-100%)';
      
      // Force reflow
      element.offsetHeight;
      
      // Slide in new value (from top)
      element.style.transition = 'all 0.3s ease-out';
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
      
      // Clean up after animation
      setTimeout(() => {
        element.style.position = '';
        element.style.overflow = '';
        element.style.transform = '';
        element.style.transition = '';
      }, 300);
    }, 300);
    
    return true;
  }

  /**
   * Update all elements for a specific project
   */
  updateProject(project) {
    // Skip updating projects that are currently being edited
    if (this.pausedProjects.has(project.id)) {
      console.log('📊 [REFRESH] Skipping project', project.id, '- currently being edited');
      return 0;
    }
    
    const elements = document.querySelectorAll(
      `[data-refresh="true"][data-project-id="${project.id}"]`
    );

    let updatedCount = 0;
    
    elements.forEach(element => {
      if (this.updateElement(element, project)) {
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      console.log('📊 [REFRESH] Updated', updatedCount, 'elements for project', project.id);
      
      // Dispatch custom event for project update
      document.dispatchEvent(new CustomEvent('projectRefreshed', {
        detail: {
          projectId: project.id,
          project: project,
          updatedCount: updatedCount,
        }
      }));
    }

    return updatedCount;
  }

  /**
   * Pause polling for a specific project (while it's being edited)
   */
  pauseProject(projectId) {
    console.log('📊 [REFRESH] Pausing updates for project', projectId);
    this.pausedProjects.add(projectId);
  }

  /**
   * Resume polling for a specific project (after edit completes)
   */
  resumeProject(projectId) {
    console.log('📊 [REFRESH] Resuming updates for project', projectId);
    this.pausedProjects.delete(projectId);
  }

  /**
   * Main refresh method
   */
  async refresh() {
    try {
      console.log('📊 [REFRESH] Starting refresh cycle');
      this.lastPoll = new Date();

      // Scan page for projects
      const projectIds = this.scanPage();
      
      if (projectIds.length === 0) {
        console.log('📊 [REFRESH] No projects to refresh');
        return;
      }

      // Fetch fresh data
      const projects = await this.fetchProjects(projectIds);
      
      if (projects.length === 0) {
        console.log('📊 [REFRESH] No project data returned');
        return;
      }

      // Update each project
      let totalUpdates = 0;
      projects.forEach(project => {
        totalUpdates += this.updateProject(project);
        
        // Update cache
        this.projectCache.set(project.id, {
          data: project,
          timestamp: new Date(),
        });
      });

      if (totalUpdates > 0) {
        console.log('📊 [REFRESH] Refresh complete:', totalUpdates, 'total updates');
      }
      
    } catch (error) {
      console.error('📊 [REFRESH] Error during refresh:', error);
    }
  }

  /**
   * Manually update a specific project by ID
   */
  async refreshProject(projectId) {
    console.log('📊 [REFRESH] Manual refresh for project', projectId);
    
    const projects = await this.fetchProjects([projectId]);
    
    if (projects.length > 0) {
      return this.updateProject(projects[0]);
    }
    
    return 0;
  }

  /**
   * Get cached project data
   */
  getCachedProject(projectId) {
    return this.projectCache.get(projectId);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.projectCache.clear();
  }
}

// DISABLED - DO NOT AUTO-START
// This was causing excessive database queries
// Use the generic refresh-manager.ts instead

// Make it globally available (for manual testing only)
if (typeof window !== 'undefined') {
  window.ProjectRefreshManager = ProjectRefreshManager;
  
  // AUTO-START DISABLED - Use refresh-manager.ts instead
  // window.addEventListener('load', () => {
  //   console.log('📊 [REFRESH] DEPRECATED - Use refresh-manager.ts instead');
  // });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProjectRefreshManager;
}
