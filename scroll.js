// $(window).scroll(function() {   
//     if($(window).scrollTop() == $(document).height()) {
//         // alert("bottom!");
//     }
//     console.log($(window).scrollTop());

//     // Update scrollbar to be te height of the winndow


//     document.querySelector("#scrollable>svg").style.width = scale($(window).scrollTop(), 0, 4000, window.innerWidth - 60, 4000);
//     document.querySelector("#scrollable>svg").attributes["viewbox"] = scale($(window).scrollTop(), 0, 4000, window.innerWidth - 60, 4000);


//  });


//  function scale (number, inMin, inMax, outMin, outMax) {
//     return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
// }



function closePopup() {
    const popup = document.getElementById('popup-container');
    popup.style.display = "none";
}