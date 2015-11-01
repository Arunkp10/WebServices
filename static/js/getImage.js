console.log("getImage called!");
$(document).ready(function(){
	$("#getImage").unbind();
	$("#getImage").bind("click", function(){
		console.log("getImage service called");
		var patientId = $("#patientId").val();
		var recId = $("#recId").val();
		callServer ('get_icu_image', {
			patientId: patientId, 
			recId: recId}, 
			function (err, data){
			if (err)
				return;
			console.log("get_icu_image: " + JSON.stringify(data));
		});
	});
});