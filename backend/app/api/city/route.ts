import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

const SOURCE_URL = 'https://www.travelsafe-abroad.com';

interface CityDetails {
  name: string;
  country: string;
  url: string;
  safetyIndex?: number | null;
  userSentiment?: {
    score: number | null;
    totalReviews: number | null;
  };
  description?: string;
  riskLevel?: string | null;
  relatedCities?: Array<{
    name: string;
    url: string;
    riskLevel?: string | null;
  }>;
}

function extractRiskLevel(classAttr: string | undefined | null): string | null {
  if (!classAttr) return null;
  if (classAttr.includes('cell-color-red')) return 'high';
  if (classAttr.includes('cell-color-orange')) return 'medium';
  if (classAttr.includes('cell-color-green')) return 'low';
  if (classAttr.includes('cell-color-gray')) return 'unknown';
  return null;
}

function parseCityPage(html: string, cityUrl: string): CityDetails | null {
  const $ = load(html);

  // Extract city name and country from title or breadcrumbs
  let title = $('h1.entry-title, .entry-title h1').first().text().trim();
  // Clean up title if it contains "Is X Safe?" pattern
  title = title.replace(/^Is\s+/i, '').replace(/\s+Safe\?.*$/i, '').trim();
  const titleParts = title.split(',').map((s) => s.trim());
  let cityName = titleParts[0] || '';
  const country = titleParts[1] || '';
  
  // If we still don't have a clean city name, try extracting from URL
  if (!cityName || cityName.length > 50) {
    const urlMatch = cityUrl.match(/\/([^\/]+)\/([^\/]+)\/?$/);
    if (urlMatch && urlMatch[2]) {
      cityName = urlMatch[2]
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  // Extract safety index
  const safetyIndexText = $('#progress #percent').first().text().trim();
  const safetyIndex = safetyIndexText ? parseInt(safetyIndexText, 10) : null;

  // Extract user sentiment
  const userSentimentPercent = $('.user-sentiment-percent').text().trim();
  const userSentimentScore = userSentimentPercent ? parseInt(userSentimentPercent, 10) : null;

  // Extract total reviews
  const reviewsText = $('.total-reviews-line span').last().text().trim();
  const totalReviews = reviewsText ? parseInt(reviewsText, 10) : null;

  // Extract description/content
  const entryContent = $('.entry-content').first();
  // Remove safety index boxes, user sentiment, and related cities sections
  entryContent.find('.safety-index-box, .user-sentiment-box, .more-cities').remove();
  entryContent.find('script, style').remove();
  let description = entryContent.text().trim();
  // Clean up excessive whitespace
  description = description.replace(/\s+/g, ' ').trim();
  // Limit description length
  if (description.length > 5000) {
    description = description.substring(0, 5000) + '...';
  }

  // Extract related cities from "Safety by City" section
  const relatedCities: CityDetails['relatedCities'] = [];
  const moreCitiesSection = entryContent.find('.more-cities').first();
  if (moreCitiesSection.length === 0) {
    // Try finding it elsewhere on the page
    $('.more-cities ul li a').each((_, anchor) => {
      const name = $(anchor).text().trim();
      const href = $(anchor).attr('href');
      if (name && href) {
        const url = href.startsWith('http') ? href : `${SOURCE_URL}${href}`;
        relatedCities.push({
          name,
          url,
          riskLevel: extractRiskLevel($(anchor).attr('class')),
        });
      }
    });
  } else {
    moreCitiesSection.find('ul li a').each((_, anchor) => {
      const name = $(anchor).text().trim();
      const href = $(anchor).attr('href');
      if (name && href) {
        const url = href.startsWith('http') ? href : `${SOURCE_URL}${href}`;
        relatedCities.push({
          name,
          url,
          riskLevel: extractRiskLevel($(anchor).attr('class')),
        });
      }
    });
  }

  // Determine risk level from safety index
  let riskLevel: string | null = null;
  if (safetyIndex !== null) {
    if (safetyIndex >= 70) riskLevel = 'low';
    else if (safetyIndex >= 50) riskLevel = 'medium';
    else riskLevel = 'high';
  }

  return {
    name: cityName,
    country,
    url: cityUrl,
    safetyIndex,
    userSentiment: {
      score: userSentimentScore,
      totalReviews,
    },
    description: description || undefined,
    riskLevel,
    relatedCities: relatedCities.length > 0 ? relatedCities : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required parameter: url',
          example: '/api/city?url=https://www.travelsafe-abroad.com/italy/rome/',
        },
        { status: 400 }
      );
    }

    // Validate URL is from travelsafe-abroad.com
    if (!url.includes('travelsafe-abroad.com')) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'URL must be from travelsafe-abroad.com',
        },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        'user-agent':
          'CitiesInfoCollectionBot/1.0 (+https://github.com/your-org/cities-info-collection)',
        accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 60 * 60 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Failed to fetch city page (status ${response.status})`,
          scrapedAt: new Date().toISOString(),
        },
        { status: response.status }
      );
    }

    const html = await response.text();
    const cityDetails = parseCityPage(html, url);

    if (!cityDetails) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to parse city page',
          scrapedAt: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      source: SOURCE_URL,
      scrapedAt: new Date().toISOString(),
      city: cityDetails,
    });
  } catch (error) {
    console.error('City scraping error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to scrape city information',
        scrapedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

