describe("Analytics::KissMetrics", function(){

  var _kmq = {
    push: function(){}
  }
  Analytics.KissMetrics.prototype.getAnalyticsObject = function() { return _kmq };

  it("should execute a _kmq.push for record method", function() {
    spyOn(_kmq, "push").andCallThrough();
    loadFixtures("km_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(new Analytics.KissMetrics());
    Analytics.init();

    var element;

    element = $("#list1-item2");
    element.click();
    expect(_kmq.push).toHaveBeenCalledWith(["record", "UserActions", {input: "foo2", text: "item 2", foo: "bar"}]);
  });

  it("should execute a _kmq.push for _trackSocial method", function() {
    spyOn(_kmq, "push").andCallThrough();
    loadFixtures("km_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(new Analytics.KissMetrics());
    Analytics.init();

    var element = $("#button");
    element.click();
    expect(_kmq.push).toHaveBeenCalledWith(["set", {foo: "bar"}]);
  });

});