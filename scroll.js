$(window).scroll(function() {   
    if($(window).scrollTop() == $(document).height()) {
        // alert("bottom!");
    }
    console.log($(window).scrollTop());

    // Update scrollbar to be te height of the winndow


 });
 

 function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
 