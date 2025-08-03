import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Clock, AlertCircle, CheckCircle } from "lucide-react";
import Chatbot from './components/Chatbot'

const App = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 20;

  useEffect(() => {
    fetchGrantsFromAPI();
  }, [currentPage]);

  const fetchGrantsFromAPI = async (searchKeyword = "") => {
    setLoading(true);

    const requestBody = {
      keyword: searchKeyword,
      oppStatus: "forecasted|posted",
      sortBy: "openDate|desc",
      rows: resultsPerPage,
      offset: (currentPage - 1) * resultsPerPage,
    };

    try {
      const response = await fetch("https://grant-search-server.vercel.app/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();

      if (data.data && data.data.oppHits && Array.isArray(data.data.oppHits)) {
        const formattedOpportunities = data.data.oppHits.map((opp) => ({
          id: opp.id,
          number: opp.number,
          title: opp.title || "Untitled Grant",
          agency: opp.agency || "Federal Agency",
          openDate: opp.openDate || "",
          closeDate: opp.closeDate || "",
          deadline: formatDeadline(opp.closeDate),
          description: opp.docType === "forecast" ? "Forecasted Opportunity" : opp.title,
          amount: "Amount varies",
          category: "General",
          link: opp.id
              ? `https://www.grants.gov/search-results-detail/${encodeURIComponent(opp.id)}`
              : "#",
        }));

        setOpportunities(formattedOpportunities);
        setTotalResults(data.data.hitCount || 0);
      } else {
        setOpportunities([]);
        setTotalResults(0);
      }
    } catch (error) {
      console.error("Error fetching from Grants.gov API:", error);
      setOpportunities(generateFallbackData());
      setTotalResults(generateFallbackData().length);
    }

    setLoading(false);
  };

  const formatDeadline = (closeDate) => {
    if (!closeDate) return "No deadline specified";

    const dateParts = closeDate.split("/");
    if (dateParts.length !== 3) return closeDate; // fallback if format unexpected

    const [month, day, year] = dateParts;
    const date = new Date(`${year}-${month}-${day}`);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Applications closed";
    if (diffDays <= 7) return "Closing soon";
    if (diffDays <= 30) return `${diffDays} days remaining`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generateFallbackData = () => [
    {
      title: "NSF Research Traineeship Program",
      link: "https://www.grants.gov/web/grants/view-opportunity.html?oppId=NSF-12345",
      deadline: "March 15, 2025",
      description: "Supporting graduate student training in emerging research areas",
      amount: "$3,000,000",
      category: "Education",
      agency: "National Science Foundation",
      id: "NSF-12345",
    },
    {
      title: "USDA Rural Development Grant",
      link: "https://www.grants.gov/web/grants/view-opportunity.html?oppId=USDA-12346",
      deadline: "Closing soon",
      description: "Infrastructure improvements for rural communities",
      amount: "$500,000 - $2,000,000",
      category: "Community Development",
      agency: "Department of Agriculture",
      id: "USDA-12346",
    },
  ];

  const handleSearch = () => {
    setCurrentPage(1);
    fetchGrantsFromAPI(searchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDeadlineStatus = (deadline) => {
    const lower = deadline.toLowerCase();
    if (lower.includes("closed")) return { color: "destructive", icon: AlertCircle };
    if (lower.includes("soon")) return { color: "secondary", icon: Clock };
    return { color: "default", icon: CheckCircle };
  };

  const filtered = opportunities;

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 sm:mb-3">
              Grant Funding Opportunities Browser
            </h1>
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg px-4">
              Discover and track funding opportunities for your projects
            </p>
          </div>

          {/* Search */}
          <div className="mb-6 sm:mb-8 max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                    className="pl-10 h-11 sm:h-12 text-sm sm:text-base shadow-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
              </div>
              <Button
                  onClick={handleSearch}
                  className="h-11 sm:h-12 px-4 sm:px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                <Search className="h-4 w-4 sm:hidden mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 sm:mb-8 text-center">
            <p className="text-slate-600 text-sm sm:text-base">
              Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalResults.toLocaleString()}</span> opportunities
            </p>
            {totalResults > resultsPerPage && (
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
                </p>
            )}
          </div>

          {/* Opportunities Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full max-w-[1700px] mx-auto">
            {filtered.map((item, idx) => {
              const status = getDeadlineStatus(item.deadline);
              const StatusIcon = status.icon;

              return (
                  <Card
                      key={item.id || idx}
                      className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300 bg-white h-full flex flex-col"
                  >
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-2">
                          {item.title}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                      </div>
                      {item.description && (
                          <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-3">{item.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 flex-grow flex flex-col justify-between">
                      <div className="space-y-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <Badge variant={status.color} className="text-xs">
                            {item.deadline}
                          </Badge>
                        </div>

                        {item.agency && (
                            <p className="text-xs text-slate-500">
                              Agency: <span className="font-medium">{item.agency}</span>
                            </p>
                        )}
                      </div>

                      <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm transition-colors mt-auto"
                      >
                        View Details
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardContent>
                  </Card>
              );
            })}
          </div>

          {/* Loading State */}
          {loading && (
              <div className="text-center py-8 sm:py-12">
                <div className="text-slate-400 mb-4">
                  <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto animate-spin" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-slate-600 mb-2">Loading opportunities...</h3>
                <p className="text-sm sm:text-base text-slate-500">Fetching latest grants from Grants.gov</p>
              </div>
          )}

          {/* Pagination */}
          {!loading && totalResults > resultsPerPage && (
              <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
                <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-sm"
                >
                  Previous
                </Button>

                {[...Array(Math.min(5, Math.ceil(totalResults / resultsPerPage)))].map((_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum <= Math.ceil(totalResults / resultsPerPage)) {
                    return (
                        <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            onClick={() => handlePageChange(pageNum)}
                            className="text-sm w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                    );
                  }
                  return null;
                })}

                <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalResults / resultsPerPage)}
                    className="text-sm"
                >
                  Next
                </Button>
              </div>
          )}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="text-slate-400 mb-4">
                  <Search className="h-8 w-8 sm:h-12 sm:w-12 mx-auto" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-slate-600 mb-2">No opportunities found</h3>
                <p className="text-sm sm:text-base text-slate-500">Try different search terms or check back later</p>
              </div>
          )}
        </div>
        <Chatbot />
      </div>
  );
};

export default App;
