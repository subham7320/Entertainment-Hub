const clientId = '2413a811573b44bcbc4afbc78f21881c';
const clientSecret = '02cad675c0514cc1889d20882a2c872b';

let accessToken = null;
let currentAudio = null;
let isPlaying = false;
let currentTrack = null;
let isLoading = false;
let currentPage = 1;
const tracksPerPage = 20;
let allTracks = [];
let isLoadingMore = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
      await getClientCredentialsToken();
      if (accessToken) {
          await initializeCategories();
          setupEventListeners();
          setupInfiniteScroll();
      }
  } catch (error) {
      console.error('Initialization error:', error);
      displayErrorMessage('Failed to initialize the application. Please try again.');
  }
});

// Setup infinite scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoadingMore) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 300) { // Increased threshold
            loadMoreTracks();
        }
    });
}

async function loadMoreTracks() {
    if (isLoadingMore || !allTracks.length) return;
    
    const loadingMore = document.getElementById('loadingMore');
    loadingMore.classList.remove('hidden');
    isLoadingMore = true;
    
    try {
        const startIndex = currentPage * tracksPerPage;
        const endIndex = startIndex + tracksPerPage;
        
        if (startIndex < allTracks.length) {
            // Add artificial delay for smooth loading
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const nextTracks = allTracks.slice(startIndex, endIndex);
            appendTracks(nextTracks);
            currentPage++;
            
            // Hide loading if we've loaded all tracks
            if (endIndex >= allTracks.length) {
                loadingMore.classList.add('hidden');
            }
        } else {
            loadingMore.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading more tracks:', error);
        displayErrorMessage('Failed to load more tracks. Please try again.');
    } finally {
        isLoadingMore = false;
    }
}

function appendTracks(tracks) {
  const songList = document.getElementById('songList');
  const newTracksHtml = tracks.map(track => createTrackHTML(track)).join('');
  songList.insertAdjacentHTML('beforeend', newTracksHtml);
}

async function getClientCredentialsToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials'
            })
        });

        const data = await response.json();
        if (data.access_token) {
            accessToken = data.access_token;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Token error:', error);
        return false;
    }
}

const musicCategories = {
  hindi: {
      title: 'Hindi Songs',
      playlist: '37i9dQZF1DX0XUfTFmNBRM'
  },
  bhojpuri: {
      title: 'Bhojpuri Hits',
      // Updated Bhojpuri playlist ID
      playlist: '37i9dQZF1DX7yqyXNmBQvk'
  },
  punjabi: {
      title: 'Punjabi Beats',
      playlist: '37i9dQZF1DX5cZuAHLNjGz'
  },
  english: {
      title: 'English Top 40',
      playlist: '37i9dQZF1DXcBWIGoYBM5M'
  }
};

async function initializeCategories() {
    const categoryContainer = document.getElementById('categoryContainer');
    categoryContainer.innerHTML = Object.entries(musicCategories)
        .map(([key, category]) => `
            <button class="category-btn ${key === 'hindi' ? 'active' : ''}" 
                    data-category="${key}">
                ${category.title}
            </button>
        `).join('');

    // Load initial category (Hindi)
    await loadCategoryTracks('hindi');
}

async function loadCategoryTracks(category) {
    showLoading(true);
    try {
      const playlist = musicCategories[category].playlist;
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist}/tracks?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
  
      const data = await response.json();
      if (data.error) {
        if (data.error.status === 401) {
          await getClientCredentialsToken();
          await loadCategoryTracks(category);
          return;
        }
        throw new Error(data.error.message);
      }
  
      allTracks = data.items
        .filter(item => item.track && item.track.preview_url)
        .map(item => item.track);
      
      if (allTracks.length === 0) {
        displayErrorMessage('No tracks available in this category.');
        return;
      }
      
      currentPage = 1;
      displayTracks(allTracks.slice(0, tracksPerPage));
      
    } catch (error) {
      console.error('Error loading tracks:', error);
      displayErrorMessage('Failed to load tracks. Please try again.');
    } finally {
      showLoading(false);
    }
}

async function searchTracks(query) {
    if (!query.trim()) return;
    
    showLoading(true);
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const data = await response.json();
        if (data.error) {
            if (data.error.status === 401) {
                await getClientCredentialsToken();
                await searchTracks(query);
                return;
            }
            throw new Error(data.error.message);
        }

        const tracks = data.tracks.items.filter(track => track.preview_url);
        if (tracks.length === 0) {
            displayErrorMessage('No songs found with preview available.');
            return;
        }
        
        displayTracks(tracks);
    } catch (error) {
        console.error('Search error:', error);
        displayErrorMessage('Failed to search tracks. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display tracks in the song list
function displayTracks(tracks) {
    const songList = document.getElementById('songList');
    currentPage = 1; // Reset page count when displaying new tracks
    
    songList.innerHTML = tracks.slice(0, tracksPerPage).map(track => createTrackHTML(track)).join('');
    
    // Show loading more if there are more tracks
    const loadingMore = document.getElementById('loadingMore');
    if (tracks.length > tracksPerPage) {
        loadingMore.classList.remove('hidden');
    } else {
        loadingMore.classList.add('hidden');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Remove old search bar if exists
    const oldSearchBar = document.querySelector('.search-bar');
    if (oldSearchBar) {
        oldSearchBar.remove();
    }

    // Setup search functionality
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    searchButton.addEventListener('click', () => {
        searchTracks(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchTracks(searchInput.value);
        }
    });

    // Setup category buttons
    document.getElementById('categoryContainer').addEventListener('click', async (e) => {
        if (e.target.classList.contains('category-btn')) {
            const category = e.target.dataset.category;
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            await loadCategoryTracks(category);
        }
    });

    const miniPlayerPlayPause = document.getElementById('miniPlayerPlayPause');
    if (miniPlayerPlayPause) {
        miniPlayerPlayPause.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            togglePlayPause();
        });
    }

    document.getElementById('miniPlayer').addEventListener('click', (e) => {
        if (!e.target.closest('#miniPlayerPlayPause')) {
            toggleExpandedPlayer();
        }
    });

     // Update toggle play/pause function
     window.togglePlayPause = function() {
        if (!currentAudio) return;
        
        if (isPlaying) {
            currentAudio.pause();
        } else {
            currentAudio.play();
        }
        isPlaying = !isPlaying;
        updatePlayerControls();
    };

    document.querySelector('.mini-player-controls').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling to mini player
        togglePlayPause();
      });

    // Add event listeners for expanded player controls
    const expandedControls = document.querySelector('.expanded-controls');
    expandedControls.addEventListener('click', (e) => {
        const action = e.target.closest('button')?.dataset.action;
        if (action) {
        switch (action) {
            case 'previous':
            playPreviousTrack();
            break;
            case 'play':
            togglePlayPause();
            break;
            case 'next':
            playNextTrack();
            break;
            case 'download':
            downloadCurrentTrack();
            break;
        }
        }
    });

    // Add progress bar click handler
    document.querySelector('.progress-bar').addEventListener('click', (e) => {
        if (!currentAudio) return;
        const progressBar = e.currentTarget;
        const clickPosition = (e.pageX - progressBar.offsetLeft) / progressBar.offsetWidth;
        currentAudio.currentTime = clickPosition * currentAudio.duration;
        updateProgress();
    });

    // Add close button handler for expanded player
    document.querySelector('.expanded-player-header').addEventListener('click', (e) => {
        if (e.target.closest('.close-btn')) {
            toggleExpandedPlayer(false);
        }
    });

    // Setup mini player controls
    document.getElementById('miniPlayerPlayPause').addEventListener('click', togglePlayPause);
}

// Play track function
async function playTrack(track) {
  try {
      if (currentAudio) {
          currentAudio.pause();
          if (currentTrack?.id === track.id) {
              togglePlayPause();
              return;
          }
      }

      currentTrack = track;
      currentAudio = new Audio(track.preview_url);
      
      // Show loading state
      const miniPlayer = document.getElementById('miniPlayer');
      miniPlayer.classList.remove('hidden');
      
      // Wait for audio to be loaded
      await currentAudio.load();
      
      updateMiniPlayer(track);
      currentAudio.play();
      isPlaying = true;
      updatePlayerControls();
      
      // Setup audio event listeners
      setupAudioEventListeners();
  } catch (error) {
      console.error('Error playing track:', error);
      displayErrorMessage('Failed to play the track. Please try again.');
  }
}

// Toggle play/pause
function togglePlayPause() {
    if (!currentAudio) return;
    
    if (isPlaying) {
        currentAudio.pause();
    } else {
        currentAudio.play();
    }
    isPlaying = !isPlaying;
    updatePlayerControls();
}

// Update mini player
function updateMiniPlayer(track) {
  const miniPlayer = document.getElementById('miniPlayer');
  document.getElementById('miniPlayerImg').src = track.album.images[0]?.url || '/placeholder.png';
  document.getElementById('miniPlayerTitle').textContent = track.name;
  document.getElementById('miniPlayerArtist').textContent = track.artists[0].name;
  miniPlayer.classList.remove('hidden');
  
  // Update progress bar
  updateProgress();
}

// Update expanded player
function updateExpandedPlayer(track) {
  const expandedPlayer = document.getElementById('expandedPlayer');
  document.getElementById('expandedPlayerImg').src = track.album.images[0]?.url || '/placeholder.png';
  document.getElementById('expandedPlayerTitle').textContent = track.name;
  document.getElementById('expandedPlayerArtist').textContent = track.artists[0].name;
  document.getElementById('expandedPlayerAlbum').textContent = track.album.name;
  
  // Update progress bar and duration
  updateProgress();
  expandedPlayer.classList.remove('hidden');
}

// Setup audio event listeners
function setupAudioEventListeners() {
    if (!currentAudio) return;
  
    currentAudio.addEventListener('timeupdate', () => {
      updateProgress();
    });
  
    currentAudio.addEventListener('ended', () => {
      isPlaying = false;
      updatePlayerControls();
      playNextTrack(); // Auto-play next track
    });
  
    currentAudio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      displayErrorMessage('Error playing the track. Please try another song.');
    });
}

// Update progress bar and time display
function updateProgress() {
    if (!currentAudio) return;
    
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const progressBar = document.querySelector('.progress');
    
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    
    currentTime.textContent = formatTime(currentAudio.currentTime);
    duration.textContent = formatTime(currentAudio.duration);
}

// Format time in MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update player controls (play/pause buttons)
function updatePlayerControls() {
    const miniPlayButton = document.getElementById('miniPlayerPlayPause');
    const expandedPlayButton = document.querySelector('[data-action="play"]');
    
    const iconClass = isPlaying ? 'fa-pause' : 'fa-play';
    
    if (miniPlayButton) {
        miniPlayButton.innerHTML = `<i class="fas ${iconClass}"></i>`;
    }
    if (expandedPlayButton) {
        expandedPlayButton.innerHTML = `<i class="fas ${iconClass}"></i>`;
    }
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// Display error message
function displayErrorMessage(message) {
    const songList = document.getElementById('songList');
    songList.innerHTML = `<div class="error-message">${message}</div>`;
}

function toggleExpandedPlayer(show = true) {
  const expandedPlayer = document.getElementById('expandedPlayer');
  if (show) {
      expandedPlayer.classList.remove('hidden');
      updateExpandedPlayer(currentTrack);
  } else {
      expandedPlayer.classList.add('hidden');
  }
}

// Add functions for track navigation
function playPreviousTrack() {
    if (!currentTrack) return;
    const currentIndex = allTracks.findIndex(track => track.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(allTracks[currentIndex - 1]);
    }
}
  
function playNextTrack() {
    if (!currentTrack) return;
    const currentIndex = allTracks.findIndex(track => track.id === currentTrack.id);
    if (currentIndex < allTracks.length - 1) {
      playTrack(allTracks[currentIndex + 1]);
    }
}
  
function downloadCurrentTrack() {
    if (!currentTrack?.preview_url) return;
    
    const a = document.createElement('a');
    a.href = currentTrack.preview_url;
    a.download = `${currentTrack.name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
  
// Add the createTrackHTML helper function
function createTrackHTML(track) {
    return `
        <div class="song-item">
            <img src="${track.album.images[0]?.url || '/placeholder.png'}" alt="${track.name}">
            <div class="play-overlay">
                <button onclick='playTrack(${JSON.stringify(track).replace(/'/g, "\\'")})'">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="song-info">
                <h3>${track.name}</h3>
                <p>${track.artists.map(artist => artist.name).join(', ')}</p>
            </div>
        </div>
    `;
}