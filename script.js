const apiKey = '4ed570cf060183327281982c0aca7d5d';
const baseUrl = 'https://api.themoviedb.org/3';
const imageBaseUrl = 'https://image.tmdb.org/t/p/w200';
const backdropBaseUrl = 'https://image.tmdb.org/t/p/original';

let currentPage = 1;
let currentGenre = '';
let currentSearch = '';
let isLoading = false;
let isSearchActive = false;
let currentFetchFunction = null;
let movie1, movie2;
let isDarkModeActive = false;
let currentMood = '';
let hasMoreMovies = true;


const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" }
];

document.addEventListener('DOMContentLoaded', () => {
    setupGenreDropdown();
    setupEventListeners();
    loadInitialContent();
    setupInfiniteScroll();
    setupMoodSelector();
    setupUserAccount();
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', toggleDarkMode);

    //This will show the creator name at the bottom.
    const developerPopup = document.getElementById('developerPopup');
    // Showing popup
    setTimeout(() => {
        developerPopup.classList.add('show');
    }, 1000);
    
    // Hiding popup after 5 seconds
    setTimeout(() => {
        developerPopup.classList.remove('show');
    }, 6000);
    
    // click event added to hide the popup
    developerPopup.addEventListener('click', () => {
        developerPopup.classList.remove('show');
    });
});

function setupGenreDropdown() {
    const genreSelect = document.getElementById('genreSelect');
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
    });
}

function getSelectedGenres() {
    const genreSelect = document.getElementById('genreSelect');
    return Array.from(genreSelect.selectedOptions).map(option => option.value);
}

function setupEventListeners() {
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('searchInput').addEventListener('input', handleSearchInput);
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', handleOutsideClick);
    document.getElementById('randomMovie').addEventListener('click', showRandomMovie);
    document.getElementById('scrollToTop').addEventListener('click', scrollToTop);
    window.addEventListener('scroll', toggleScrollToTopButton);
    document.getElementById('loadMore').addEventListener('click', loadMoreMovies);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('searchButton').addEventListener('click', () => {
        currentPage = 1;
        isSearchActive = true;
        currentFetchFunction = null;
        searchMovies();
    });

    document.querySelector('.sidebar-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });
    document.getElementById('genreSelect').addEventListener('change', handleGenreChange);
    document.querySelector('.star-rating').addEventListener('click', handleRatingChange);
}

function clearFilters() {
    document.querySelectorAll('.genre-tag.active').forEach(tag => tag.classList.remove('active'));
    //document.getElementById('minRating').value = 0;
    document.getElementById('ratingValue').textContent = '0';
    document.querySelectorAll('.star-rating span').forEach(star => {
        star.textContent = '☆';
        star.classList.remove('filled');
    });
    document.getElementById('searchInput').value = '';
    currentMood = '';
    document.querySelectorAll('.mood-options button').forEach(btn => btn.classList.remove('selected'));
    
    showAllSections();
    currentPage = 1;
    currentFetchFunction = null;
    loadInitialContent();
}

function toggleDarkMode() {
    isDarkModeActive = !isDarkModeActive;
    document.body.classList.toggle('dark-mode');
    
    if (isDarkModeActive) {
        document.body.style.backgroundColor = '#1a1a1a';
    } else {
        // Reset to the current color in the cycle
        const colors = ['#ff9a9e', '#fad0c4', '#ffecd2', '#fcb69f', '#ff9a9e', '#1a1a1a'];
        const currentIndex = Math.floor(Date.now() / 10000) % colors.length;
        document.body.style.backgroundColor = colors[currentIndex];
    }
}

function handleSearchInput(e) {
    if (e.target.value === '') {
        showAllSections();
    }
}

function closeModal() {
    document.getElementById('movieModal').style.display = "none";
}

function handleOutsideClick(event) {
    const modal = document.getElementById('movieModal');
    if (event.target === modal) {
        closeModal();
    }
}

function handleRatingChange(e) {
    document.getElementById('ratingValue').textContent = e.target.value;
    searchMovies();
}

function handleGenreChange() {
    const selectedGenres = getSelectedGenres();
    currentPage = 1;
    if (selectedGenres.length === 0) {
        loadInitialContent();
    } else {
        searchMoviesByGenre(selectedGenres);
    }
}


async function searchMoviesByGenre(genres, append = false) {
    showLoading();
    try {
        currentFetchFunction = (append) => searchMoviesByGenre(genres, append);
        const url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genres.join(',')}&page=${currentPage}`;
        const movies = await fetchMovies(url);
        
        const movieList = document.getElementById("movieList");
        const searchResults = document.getElementById("searchResults");
        
        if (!append) {
            movieList.innerHTML = "";
        }
        
        if (movies.length === 0 && !append) {
            movieList.innerHTML = "<p>No movies found for the selected genres.</p>";
        } else {
            movies.forEach(movie => {
                const movieElement = createMovieElement(movie);
                movieList.appendChild(movieElement);
            });
        }

        // Hide other sections and show search results
        document.getElementById('latestMovies').style.display = 'none';
        document.getElementById('popularMovies').style.display = 'none';
        document.getElementById('trendingMovies').style.display = 'none';
        searchResults.style.display = "block";

        // Show the Load More button for genre results
        showLoadMoreButton(true);
    } catch (error) {
        console.error('Error searching movies by genre:', error);
    } finally {
        hideLoading();
    }
}

async function loadInitialContent(append = false) {
    showLoading();
    try {
        currentFetchFunction = loadInitialContent;
        const [latestMovies, popularMovies, trendingMovies] = await Promise.all([
            fetchMovies(`${baseUrl}/movie/now_playing?api_key=${apiKey}&language=en-US&page=${currentPage}`),
            fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=${currentPage}`),
            fetchMovies(`${baseUrl}/trending/movie/week?api_key=${apiKey}&page=${currentPage}`)
        ]);

        displayMovies(latestMovies, document.querySelector('#latestMovies .movie-row'), append);
        displayMovies(popularMovies, document.querySelector('#popularMovies .movie-row'), append);
        displayMovies(trendingMovies, document.querySelector('#trendingMovies .movie-row'), append);

        if (!append) {
            setRandomBackdrop();
        }
    } catch (error) {
        console.error('Error loading content:', error);
    } finally {
        hideLoading();
    }
}

async function loadLatestMovies() {
    const movies = await fetchMovies(`${baseUrl}/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
    displayMovies(movies, document.querySelector('#latestMovies .movie-row'));
}

async function loadPopularMovies() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    displayMovies(movies, document.querySelector('#popularMovies .movie-row'));
}

async function loadTrendingMovies() {
    const movies = await fetchMovies(`${baseUrl}/trending/movie/week?api_key=${apiKey}`);
    displayMovies(movies, document.querySelector('#trendingMovies .movie-row'));
}

async function setRandomBackdrop() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    if (movies.length > 0) {
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        const heroElement = document.getElementById('hero');
        heroElement.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backdropBaseUrl}${randomMovie.backdrop_path})`;
    }
}

async function fetchMovies(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data.results;
}

function displayMovies(movies, container, append = false) {
    if (!append) {
        container.innerHTML = '';
    }
    movies.forEach(movie => {
        const movieElement = createMovieElement(movie);
        container.appendChild(movieElement);
    });
}

function createMovieElement(movie) {
    const movieElement = document.createElement("div");
    movieElement.className = "movie";
    movieElement.innerHTML = `
        <div class="movie-poster">
            <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}" loading="lazy">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>Rating: ${movie.vote_average.toFixed(1)}/10</p>
                <p>Release: ${movie.release_date}</p>
                <button class="trailer-btn" data-movie-id="${movie.id}">
                    <i class="fas fa-play"></i> Trailer
                </button>
                ${isInWatchlist(movie.id) ? '<span class="in-watchlist"><i class="fas fa-check"></i> In Watchlist</span>' : ''}
            </div>
        </div>
        <div class="movie-synopsis">${movie.overview.substring(0, 100)}...</div>
    `;
    movieElement.addEventListener('click', () => showMovieDetails(movie.id));
    return movieElement;
}

function showAllSections() {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('latestMovies').style.display = 'block';
    document.getElementById('popularMovies').style.display = 'block';
    document.getElementById('trendingMovies').style.display = 'block';
}
  
async function searchMovies() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput.value.trim();

    if (!query) {
        alert("Please enter a search term");
        return;
    }

    showLoading();
    try {
        const url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`;
        const movies = await fetchMovies(url);
        
        const movieList = document.getElementById("movieList");
        const searchResults = document.getElementById("searchResults");
        
        movieList.innerHTML = "";
        if (movies.length === 0) {
            movieList.innerHTML = "<p>No movies found matching your search.</p>";
        } else {
            movies.forEach(movie => {
                const movieElement = createMovieElement(movie);
                movieList.appendChild(movieElement);
            });
        }

        // Hide other sections and show search results
        document.getElementById('latestMovies').style.display = 'none';
        document.getElementById('popularMovies').style.display = 'none';
        document.getElementById('trendingMovies').style.display = 'none';
        searchResults.style.display = "block";

        // Hide the Load More button for search results
        showLoadMoreButton(false);
    } catch (error) {
        console.error('Error searching movies:', error);
        movieList.innerHTML = `<p>An error occurred while searching for movies. Please try again later.</p>`;
    } finally {
        hideLoading();
    }
}

function showLoadMoreButton(show) {
    const loadMoreButton = document.getElementById('loadMore');
    if (loadMoreButton) {
        loadMoreButton.style.display = show ? 'block' : 'none';
    }
}

async function loadMoreMovies() {
    if (currentFetchFunction) {
        currentPage++;
        await currentFetchFunction(true);
    }
}

function addReview(movieId, review) {
    let reviews = JSON.parse(localStorage.getItem('movieReviews')) || {};
    if (!reviews[movieId]) {
      reviews[movieId] = [];
    }
    reviews[movieId].push(review);
    localStorage.setItem('movieReviews', JSON.stringify(reviews));
}
  
function getReviews(movieId) {
    let reviews = JSON.parse(localStorage.getItem('movieReviews')) || {};
    return reviews[movieId] || [];
}

async function getRelatedMovies(movieId) {
    const url = `${baseUrl}/movie/${movieId}/similar?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results.slice(0, 5); // Return top 5 similar movies
}

function addToWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    if (!watchlist.some(m => m.id === movie.id)) {
      watchlist.push(movie);
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
    alert(`Movie ${movieId} added to watchlist`);
}
  
function removeFromWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    watchlist = watchlist.filter(m => m.id !== movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}
  
async function showMovieDetails(movieId) {
    showLoading();
    const modal = document.getElementById('movieModal');
    const modalContent = document.getElementById('movieDetails');
    modalContent.innerHTML = "";
    modal.style.display = "block";

    try {
        const response = await fetch(`${baseUrl}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,similar`);
        const movie = await response.json();

        const cast = movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
        const similarMovies = movie.similar.results.slice(0, 5).map(m => m.title).join(', ');

        modalContent.innerHTML = `
            <div class="movie-detail-header" style="background-image: url(${backdropBaseUrl}${movie.backdrop_path})">
                <h2>${movie.title}</h2>
            </div>
            <div class="movie-detail-content">
                <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}" class="movie-detail-poster">
                <div class="movie-detail-info">
                    <p>${movie.overview}</p>
                    <p>Release Date: ${movie.release_date}</p>
                    <p>Rating: ${movie.vote_average}/10</p>
                    <p>Runtime: ${movie.runtime} minutes</p>
                    <p>Genres: ${movie.genres.map(g => g.name).join(', ')}</p>
                    <p>Cast: ${cast}</p>
                    <p>Similar Movies: ${similarMovies}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading movie details:', error);
        modalContent.innerHTML = "Error loading movie details.";
    } finally {
        hideLoading();
    }
    const reviews = getReviews(movieId);
    let reviewsHtml = '<h3>User Reviews</h3>';
    if (reviews.length > 0) {
        reviewsHtml += reviews.map(review => `<p class="review">${review}</p>`).join('');
    } else {
        reviewsHtml += '<p>No reviews yet.</p>';
    }
    reviewsHtml += `
        <form id="reviewForm">
            <textarea id="reviewText" required></textarea>
            <button type="submit" class="submit-review">Submit Review</button>
        </form>
    `;
    modalContent.innerHTML += reviewsHtml;

    document.getElementById('reviewForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const reviewText = document.getElementById('reviewText').value;
        addReview(movieId, reviewText);
        showMovieDetails(movieId); 
    });
    const relatedMovies = await getRelatedMovies(movieId);
    let relatedMoviesHtml = '<h3>Similar Movies</h3><div class="related-movies">';
    relatedMoviesHtml += relatedMovies.map(movie => `
        <div class="related-movie" onclick="showMovieDetails(${movie.id})">
        <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}">
        <p>${movie.title}</p>
        </div>
    `).join('');
    relatedMoviesHtml += '</div>';
    modalContent.innerHTML += relatedMoviesHtml;

    const isWatchlisted = isInWatchlist(movieId);
    const watchlistButton = `
        <button id="watchlistButton" onclick="toggleWatchlist(${movieId})">
        ${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </button>
    `;
    modalContent.innerHTML += watchlistButton;
}

function toggleWatchlist(movieId) {
    if (isInWatchlist(movieId)) {
      removeFromWatchlist(movieId);
    } else {
      addToWatchlist(movie); 
    }
    showMovieDetails(movieId); 
}

async function showRandomMovie() {
    showLoading();
    try {
        const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        await showMovieDetails(randomMovie.id);
    } catch (error) {
        console.error('Error showing random movie:', error);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function toggleScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTop");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollToTopBtn.style.display = "block";
    } else {
        scrollToTopBtn.style.display = "none";
    }
}

function handleRatingChange(e) {
    if (e.target.matches('span')) {
        const rating = parseInt(e.target.dataset.rating);
        document.getElementById('ratingValue').textContent = rating;
        document.querySelectorAll('.star-rating span').forEach((star, index) => {
            star.textContent = index < rating ? '★' : '☆';
            star.classList.toggle('filled', index < rating);
        });
        applyFilters();
    }
}

function applyFilters() {
    const selectedGenres = getSelectedGenres();
    const minRating = parseInt(document.getElementById('ratingValue').textContent);

    if (selectedGenres.length > 0 || minRating > 0) {
        filterMovies(selectedGenres, minRating);
    } else {
        loadInitialContent();
    }
}

async function filterMovies(genres, minRating) {
    showLoading();
    try {
        let url = `${baseUrl}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1`;
        
        if (genres.length > 0) {
            url += `&with_genres=${genres.join(',')}`;
        }
        
        if (minRating > 0) {
            url += `&vote_average.gte=${minRating}`;
        }

        const movies = await fetchMovies(url);
        
        const movieList = document.getElementById("movieList");
        const searchResults = document.getElementById("searchResults");
        
        movieList.innerHTML = "";
        if (movies.length === 0) {
            movieList.innerHTML = "<p>No movies found matching your criteria.</p>";
        } else {
            movies.forEach(movie => {
                const movieElement = createMovieElement(movie);
                movieList.appendChild(movieElement);
            });
        }

        // Hide other sections and show search results
        document.getElementById('latestMovies').style.display = 'none';
        document.getElementById('popularMovies').style.display = 'none';
        document.getElementById('trendingMovies').style.display = 'none';
        searchResults.style.display = "block";

        // Hide the Load More button for filtered results
        showLoadMoreButton(false);
    } catch (error) {
        console.error('Error filtering movies:', error);
    } finally {
        hideLoading();
    }
}

//USER MENU 
function setupUserAccount() {
    const userAvatarContainer = document.getElementById('userAvatarContainer');
    const userMenu = document.querySelector('.user-menu');
    const closeUserMenu = document.querySelector('.close-user-menu');
    const changeAvatarBtn = document.getElementById('changeAvatar');
    const avatarUpload = document.getElementById('avatarUpload');
    const editProfileBtn = document.getElementById('editProfile');
    const viewWatchlistBtn = document.getElementById('viewWatchlist');
    const logoutBtn = document.getElementById('logout');

    function updateAvatar(imageSrc) {
        const userMenuAvatar = document.getElementById('userMenuAvatar');
        const defaultUserIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="default-user-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>`;
        
        if (imageSrc) {
            userAvatarContainer.innerHTML = `<img src="${imageSrc}" alt="User Avatar" id="userAvatar">`;
            userMenuAvatar.src = imageSrc;
            userAvatarContainer.style.backgroundColor = 'transparent';
        } else {
            userAvatarContainer.innerHTML = defaultUserIcon;
            userMenuAvatar.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(defaultUserIcon);
            userAvatarContainer.style.backgroundColor = '#ccc';
        }
    }

    userAvatarContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.add('active');
    });

    closeUserMenu.addEventListener('click', () => {
        userMenu.classList.remove('active');
    });

    // Closes the user menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !userAvatarContainer.contains(e.target)) {
            userMenu.classList.remove('active');
        }
    });

    changeAvatarBtn.addEventListener('click', () => {
        avatarUpload.click();
    });

    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                updateAvatar(e.target.result);
                localStorage.setItem('userAvatar', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    editProfileBtn.addEventListener('click', () => {
        const newName = prompt('Enter your new name:');
        if (newName) {
            document.getElementById('userName').textContent = newName;
            localStorage.setItem('userName', newName);
        }
    });

    viewWatchlistBtn.addEventListener('click', () => {
        alert('Watchlist functionality to be implemented');
    });

    logoutBtn.addEventListener('click', () => {
        document.getElementById('userName').textContent = 'Guest';
        updateAvatar('');
        localStorage.removeItem('userAvatar');
        localStorage.removeItem('userName');
        userMenu.classList.remove('active');
    });

    // Check if there's a saved avatar and username
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        updateAvatar(savedAvatar);
    } else {
        updateAvatar(''); // This will set the default icon
    }
    const savedUserName = localStorage.getItem('userName');
    if (savedUserName) {
        document.getElementById('userName').textContent = savedUserName;
    }

    function showProfilePicture(avatarSrc) {
        const modal = document.createElement('div');
        modal.classList.add('profile-picture-modal');
        modal.innerHTML = `
            <div class="profile-picture-content">
                <span class="close-profile-picture">&times;</span>
                <img src="${avatarSrc}" alt="Profile Picture" class="full-size-avatar">
            </div>
        `;
        document.body.appendChild(modal);

        const fullSizeAvatar = modal.querySelector('.full-size-avatar');
        fullSizeAvatar.onload = () => {
            if (fullSizeAvatar.naturalWidth > window.innerWidth || fullSizeAvatar.naturalHeight > window.innerHeight) {
                fullSizeAvatar.style.width = '60%';
                fullSizeAvatar.style.height = '60%';
            }
        };

        const closeBtn = modal.querySelector('.close-profile-picture');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    const userMenuAvatar = document.getElementById('userMenuAvatar');
    userMenuAvatar.addEventListener('click', () => {
        const avatarSrc = userMenuAvatar.src;
        if (avatarSrc) {
            showProfilePicture(avatarSrc);
        }
    });
}


document.addEventListener('click', async function(e) {
    if (e.target.closest('.trailer-btn')) {
        e.stopPropagation(); // prevent opening the movie details
        const movieId = e.target.closest('.trailer-btn').dataset.movieId;
        const trailerUrl = await getTrailerUrl(movieId);
        if (trailerUrl) {
            window.open(trailerUrl, '_blank');
        } else {
            alert('Trailer not available');
        }
    }
});

//Directs to the trailer of movie to youtube
async function getTrailerUrl(movieId) {
    try {
        const response = await fetch(`${baseUrl}/movie/${movieId}/videos?api_key=${apiKey}`);
        const data = await response.json();
        const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");
        return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    } catch (error) {
        console.error('Error fetching trailer:', error);
        return null;
    }
}

function isInWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    return watchlist.some(m => m.id === movieId);
}

//Infinite scroll function setup 
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMoreMovies) return;
        
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (currentMood) {
                getMoviesByMood(currentMood, true);
            } else if (currentFetchFunction) {
                currentFetchFunction(true);
            }
        }
    });
}

//This function chnages the background colour in every ten seconds
function cycleBgColor() {
    const colors = ['#ff9a9e', '#fad0c4', '#ffecd2', '#fcb69f', '#ff9a9e', '#1a1a1a'];
    let currentIndex = 0;

    function changeColor() {
        if (!isDarkModeActive) {
            document.body.style.backgroundColor = colors[currentIndex];
            currentIndex = (currentIndex + 1) % colors.length;
        }
    }
    // Initial color change
    changeColor();
    //interval for color change
    setInterval(changeColor, 10000);
}
//Function is called when the page loads
document.addEventListener('DOMContentLoaded', cycleBgColor);


// New feature: Personalized movie mood selector
function setupMoodSelector() {
    const moodSelector = document.getElementById('moodSelector');
    if (!moodSelector) {
        console.error('Mood selector container not found');
        return;
    }
    moodSelector.innerHTML = `
        <h3>What's Your Movie Mood?</h3>
        <div class="mood-options">
            <button data-mood="happy">😊 Happy</button>
            <button data-mood="sad">😢 Sad</button>
            <button data-mood="excited">🤩 Excited</button>
            <button data-mood="relaxed">😌 Relaxed</button>
            <button data-mood="scared">😱 Scared</button>
        </div>
    `;

    moodSelector.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            currentPage = 1;
            currentMood = button.dataset.mood;
            hasMoreMovies = true;
            getMoviesByMood(currentMood);
            
            // Remove 'selected' class from all buttons
            moodSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
            // Add 'selected' class to clicked button
            button.classList.add('selected');
        });
    });
}

async function getMoviesByMood(mood, append = false) {
    if (isLoading || !hasMoreMovies) return;
    
    showLoading();
    isLoading = true;
    
    try {
        let genreIds;
        switch (mood) {
            case 'happy':
                genreIds = [35, 10402, 10751]; // Comedy, Music, Family
                break;
            case 'sad':
                genreIds = [18, 10749]; // Drama, Romance
                break;
            case 'excited':
                genreIds = [28, 12, 878]; // Action, Adventure, Science Fiction
                break;
            case 'relaxed':
                genreIds = [99, 36, 10402]; // Documentary, History, Music
                break;
            case 'scared':
                genreIds = [27, 9648, 53]; // Horror, Mystery, Thriller
                break;
            default:
                genreIds = [];
        }

        const url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genreIds.join(',')}&sort_by=popularity.desc&page=${currentPage}`;
        const movies = await fetchMovies(url);
        
        if (movies.length === 0) {
            hasMoreMovies = false;
            if (!append) {
                displayNoMoviesMessage();
            }
        } else {
            displayFilteredMovies(movies, append);
            currentPage++;
        }
        
        // Update the current fetch function
        currentFetchFunction = (append) => getMoviesByMood(mood, append);
    } catch (error) {
        console.error('Error getting movies by mood:', error);
    } finally {
        hideLoading();
        isLoading = false;
    }
}

function displayFilteredMovies(movies, append = false) {
    const movieList = document.getElementById("movieList");
    const searchResults = document.getElementById("searchResults");
    
    if (!append) {
        movieList.innerHTML = "";
    }
    
    movies.forEach(movie => {
        const movieElement = createMovieElement(movie);
        movieList.appendChild(movieElement);
    });

    document.getElementById('latestMovies').style.display = 'none';
    document.getElementById('popularMovies').style.display = 'none';
    document.getElementById('trendingMovies').style.display = 'none';
    searchResults.style.display = "block";
}

function displayNoMoviesMessage() {
    const movieList = document.getElementById("movieList");
    movieList.innerHTML = "<p>No more movies available in this category.</p>";
}

//  loadInitialContent called  to start the application
loadInitialContent();
