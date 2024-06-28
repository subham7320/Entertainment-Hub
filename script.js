const apiKey = '4ed570cf060183327281982c0aca7d5d'; // Replace with your actual TMDB API key
const baseUrl = 'https://api.themoviedb.org/3';
const imageBaseUrl = 'https://image.tmdb.org/t/p/w200';
const backdropBaseUrl = 'https://image.tmdb.org/t/p/original';
let currentPage = 1;
let currentGenre = '';
let currentSearch = '';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

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
    setupGenreList();
    setupEventListeners();
    loadInitialContent();
});

function setupGenreList() {
    const genreList = document.getElementById('genreList');
    genres.forEach(genre => {
        const button = document.createElement('button');
        button.className = 'genre-button';
        button.textContent = genre.name;
        button.onclick = () => {
            currentGenre = genre.id;
            currentPage = 1;
            searchMovies();
        };
        genreList.appendChild(button);
    });
}

function setupEventListeners() {
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMovies();
        }
    });

    document.getElementById('loadMore').addEventListener('click', () => {
        currentPage++;
        searchMovies(true);
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('movieModal').style.display = "none";
    });

    window.onclick = (event) => {
        if (event.target == document.getElementById('movieModal')) {
            document.getElementById('movieModal').style.display = "none";
        }
    };

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

    document.getElementById('minRating').addEventListener('input', (e) => {
        document.getElementById('ratingValue').textContent = e.target.value;
        searchMovies();
    });

    document.getElementById('randomMovie').addEventListener('click', showRandomMovie);

    document.getElementById('sortBy').addEventListener('change', () => searchMovies());
}

async function loadInitialContent() {
    await loadLatestMovies();
    await loadPopularMovies();
    setRandomBackdrop();
}

async function loadLatestMovies() {
    const movies = await fetchMovies(`${baseUrl}/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
    displayMovies(movies, document.querySelector('#latestMovies .movie-row'));
}

async function loadPopularMovies() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    displayMovies(movies, document.querySelector('#popularMovies .movie-row'));
}

async function setRandomBackdrop() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    const heroElement = document.getElementById('hero');
    heroElement.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backdropBaseUrl}${randomMovie.backdrop_path})`;
}

async function fetchMovies(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

function displayMovies(movies, container) {
    container.innerHTML = '';
    movies.forEach(movie => {
        const movieElement = createMovieElement(movie);
        container.appendChild(movieElement);
    });
    updateFavoriteButtons();
}

function createMovieElement(movie) {
    const movieElement = document.createElement("div");
    movieElement.className = "movie";
    movieElement.innerHTML = `
        <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}" loading="lazy">
        <h3>${movie.title}</h3>
        <p>Rating: ${movie.vote_average}/10</p>
        <button class="favorite-btn" data-movie-id="${movie.id}">🤍</button>
    `;
    movieElement.addEventListener('click', () => showMovieDetails(movie.id));
    movieElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(movie.id);
    });
    return movieElement;
}

function toggleFavorite(movieId) {
    const index = favorites.indexOf(movieId);
    if (index === -1) {
        favorites.push(movieId);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButtons();
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const movieId = btn.dataset.movieId;
        btn.textContent = favorites.includes(parseInt(movieId)) ? '❤️' : '🤍';
    });
}

async function searchMovies(append = false) {
    const searchInput = document.getElementById("searchInput");
    currentSearch = searchInput.value;
    const movieList = document.getElementById("movieList");
    const loadMoreBtn = document.getElementById("loadMore");
    const searchResults = document.getElementById("searchResults");
    const minRating = document.getElementById('minRating').value;
    const sortBy = document.getElementById('sortBy').value;

    if (!append) {
        movieList.innerHTML = "<p>Loading...</p>";
        currentPage = 1;
    }

    try {
        let url = `${baseUrl}/discover/movie?api_key=${apiKey}&sort_by=${sortBy}&page=${currentPage}`;
        if (currentGenre) {
            url += `&with_genres=${currentGenre}`;
        }
        if (currentSearch) {
            url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${currentSearch}&page=${currentPage}`;
        }

        const movies = await fetchMovies(url);
        
        if (!append) movieList.innerHTML = "";

        const filteredMovies = movies.filter(movie => movie.vote_average >= minRating);

        filteredMovies.forEach(movie => {
            const movieElement = createMovieElement(movie);
            movieList.appendChild(movieElement);
        });

        searchResults.style.display = "block";
        loadMoreBtn.style.display = filteredMovies.length === 20 ? "block" : "none";
        updateFavoriteButtons();
    } catch (error) {
        movieList.innerHTML = "<p>Error fetching movies. Please try again.</p>";
        console.error('Error:', error);
    }
}

async function showMovieDetails(movieId) {
    const modal = document.getElementById('movieModal');
    const modalContent = document.getElementById('movieDetails');
    modalContent.innerHTML = "Loading...";
    modal.style.display = "block";

    try {
        const response = await fetch(`${baseUrl}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,similar`);
        const movie = await response.json();

        const cast = movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
        const similarMovies = movie.similar.results.slice(0, 5).map(m => m.title).join(', ');

        modalContent.innerHTML = `
            <h2>${movie.title}</h2>
            <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}">
            <p>${movie.overview}</p>
            <p>Release Date: ${movie.release_date}</p>
            <p>Rating: ${movie.vote_average}/10</p>
            <p>Runtime: ${movie.runtime} minutes</p>
            <p>Budget: $${movie.budget.toLocaleString()}</p>
            <p>Genres: ${movie.genres.map(g => g.name).join(', ')}</p>
            <p>Main Cast: ${cast}</p>
            <p>Similar Movies: ${similarMovies}</p>
        `;
    } catch (error) {
        modalContent.innerHTML = "Error loading movie details.";
        console.error('Error:', error);
    }
}

async function showRandomMovie() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    showMovieDetails(randomMovie.id);
}

// Initial load
loadInitialContent();