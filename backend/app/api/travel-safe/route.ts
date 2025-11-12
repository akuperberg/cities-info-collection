import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

const SOURCE_URL = 'https://www.travelsafe-abroad.com';

interface CityEntry {
  name: string;
  url: string;
  riskLevel?: string | null;
}

interface CountryEntry {
  country: string;
  slug: string;
  url: string;
  riskLevel?: string | null;
  cities: CityEntry[];
}

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function fetchDirectoryHtml(): Promise<string> {
  const response = await fetch(SOURCE_URL, {
    headers: {
      'user-agent':
        'CitiesInfoCollectionBot/1.0 (+https://github.com/your-org/cities-info-collection)',
      accept: 'text/html,application/xhtml+xml',
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load Travel Safe directory (status ${response.status})`);
  }

  return response.text();
}

function resolveUrl(href: string | undefined | null): string | null {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  return `${SOURCE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
}

function parseDirectory(html: string): CountryEntry[] {
  const $ = load(html);
  const results: CountryEntry[] = [];

  $('.pages-list .list-country').each((_, element) => {
    const countryAnchor = $(element).find('.country-title a').first();
    const countryName = countryAnchor.find('h2').text().trim() || countryAnchor.text().trim();
    if (!countryName) return;

    const countryUrl = resolveUrl(countryAnchor.attr('href')) ?? SOURCE_URL;
    const countryRisk = extractRiskLevel(countryAnchor.attr('class'));

    const cities: CityEntry[] = [];
    $(element)
      .find('ul li a')
      .each((__, anchor) => {
        const name = $(anchor).text().trim();
        const url = resolveUrl($(anchor).attr('href'));
        if (!name || !url) return;
        cities.push({
          name,
          url,
          riskLevel: extractRiskLevel($(anchor).attr('class')),
        });
      });

    results.push({
      country: countryName,
      slug: normalize(countryName),
      url: countryUrl,
      riskLevel: countryRisk,
      cities,
    });
  });

  return results;
}

function extractRiskLevel(classAttr: string | undefined | null): string | null {
  if (!classAttr) return null;
  if (classAttr.includes('cell-color-red')) return 'high';
  if (classAttr.includes('cell-color-orange')) return 'medium';
  if (classAttr.includes('cell-color-green')) return 'low';
  if (classAttr.includes('cell-color-gray')) return 'unknown';
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const html = await fetchDirectoryHtml();
    const directory = parseDirectory(html);

    const { searchParams } = new URL(request.url);
    const countryParam = searchParams.get('country');

    if (countryParam) {
      const targetSlug = normalize(countryParam);
      const countryEntry = directory.find((entry) => entry.slug === targetSlug);

      if (!countryEntry) {
        return NextResponse.json(
          {
            status: 'not_found',
            message: `Could not find country "${countryParam}" on Travel Safe - Abroad`,
            scrapedAt: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: 'ok',
        source: SOURCE_URL,
        scrapedAt: new Date().toISOString(),
        country: countryEntry,
      });
    }

    return NextResponse.json({
      status: 'ok',
      source: SOURCE_URL,
      scrapedAt: new Date().toISOString(),
      countries: directory,
    });
  } catch (error) {
    console.error('Travel Safe scraping error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to scrape Travel Safe - Abroad directory',
        scrapedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
