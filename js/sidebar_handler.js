document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("toggle-sidebar");

    // Function to toggle sidebar and flip button
    toggleButton.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        toggleButton.classList.toggle("flipped");
        // Adjust the map width when the sidebar is opened
        if (sidebar.classList.contains("open")) {
            document.getElementById("map").style.width = "calc(100% - 300px)";
        } else {
            // Reset the map width when the sidebar is closed
            document.getElementById("map").style.width = "100%";
        }
    });
});
