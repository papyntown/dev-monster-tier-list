import { mkdir } from 'node:fs/promises'

const INPUT_JSON = 'data/monster.json'
const OUTPUT_DIR = 'public/monster'

type Product = {
  name: string
  slug?: string
  imageUrl?: string | null
  localImagePath?: string
}

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getExtension(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase()

    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return '.jpg'
    if (pathname.endsWith('.webp')) return '.webp'
    return '.png'
  } catch {
    return '.png'
  }
}

async function downloadImage(url: string, filepath: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      Accept:
        'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      Referer: 'https://www.monsterenergy.com/',
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }

  const bytes = new Uint8Array(await res.arrayBuffer())

  if (bytes.length === 0) {
    throw new Error('Empty file')
  }

  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47

  const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8

  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46

  if (!isPng && !isJpg && !isWebp) {
    throw new Error('Downloaded file does not look like an image')
  }

  await Bun.write(filepath, bytes)
}

async function main() {
  console.log('Starting image download...')
  console.log(`Reading: ${INPUT_JSON}`)
  console.log(`Output : ${OUTPUT_DIR}`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  const inputFile = Bun.file(INPUT_JSON)

  if (!(await inputFile.exists())) {
    throw new Error(`Input JSON not found: ${INPUT_JSON}`)
  }

  const json = await inputFile.json()
  const products: Product[] = Array.isArray(json) ? json : json.products

  if (!Array.isArray(products)) {
    throw new Error('JSON must be an array or contain a "products" array.')
  }

  console.log(`Found ${products.length} products`)

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const product of products) {
    const name = product.name || 'unknown'
    const imageUrl = product.imageUrl

    if (!imageUrl) {
      console.log(`SKIP  - ${name} (no imageUrl)`)
      skipped++
      continue
    }

    const slug = sanitizeFilename(product.slug || product.name || 'unknown')
    const ext = getExtension(imageUrl)
    const filepath = `${OUTPUT_DIR}/${slug}${ext}`

    if (await Bun.file(filepath).exists()) {
      console.log(`SKIP  - ${name} (${filepath} already exists)`)
      product.localImagePath = `/monster/${slug}${ext}`
      skipped++
      continue
    }

    try {
      console.log(`DOWN  - ${name}`)
      await downloadImage(imageUrl, filepath)
      product.localImagePath = `/monster/${slug}${ext}`
      console.log(`OK    - ${filepath}`)
      downloaded++
    } catch (error) {
      failed++
      console.error(
        `FAIL  - ${name}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  if (!Array.isArray(json)) {
    json.products = products
    await Bun.write(INPUT_JSON, JSON.stringify(json, null, 2))
  } else {
    await Bun.write(INPUT_JSON, JSON.stringify(products, null, 2))
  }

  console.log('')
  console.log('Done.')
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Skipped   : ${skipped}`)
  console.log(`Failed    : ${failed}`)
}

await main()
