describe("Analytics::GoogleAnalytics", function(){

  var _gaq = {
    push: function(){}
  }
  Analytics.GoogleAnalytics.prototype.getAnalyticsObject = function() { return _gaq; };

  it("should execute a _gaq.push for _trackEvent method", function() {
    spyOn(_gaq, "push").andCallThrough();
    loadFixtures("ga_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(new Analytics.GoogleAnalytics());
    Analytics.init();

    var element;

    element = $("#list1-item2 span");
    element.click();
    expect(_gaq.push).toHaveBeenCalledWith(["_trackEvent", "UserActions", "Buy", "product", "foo2"]);

    element = $("#list2-item2 span");
    element.click();
    expect(_gaq.push).toHaveBeenCalledWith(["_trackEvent", "UserActions", "Buy", "product", "foo"]);
  });

  it("should execute a _gaq.push for _trackSocial method", function() {
    spyOn(_gaq, "push").andCallThrough();
    loadFixtures("ga_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(new Analytics.GoogleAnalytics());
    Analytics.init();

    var element = $("#button");
    element.click();
    expect(_gaq.push).toHaveBeenCalledWith(["_trackSocial", "Facebook", "Buy", "product", "foo"]);
  });

});