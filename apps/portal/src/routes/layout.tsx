import Discord from '../assets/icons/discord-header.svg?react'
import GitHub from '../assets/icons/github-header.svg?react'
import Medium from '../assets/icons/medium-header.svg?react'
import Twitter from '../assets/icons/twitter-header.svg?react'
import { ModalProvider } from '../components/legacy'
import { Total } from '../components/legacy/archetypes/Wallet'
import AccountValueInfo from '../components/recipes/AccountValueInfo'
import { useShouldShowAccountConnectionGuard } from '../components/widgets/AccountConnectionGuard'
import AccountsManagementMenu from '../components/widgets/AccountsManagementMenu'
import WalletConnectionSideSheet, {
  walletConnectionSideSheetOpenState,
} from '../components/widgets/WalletConnectionSideSheet'
import DappStakingStakeSideSheet from '../components/widgets/staking/dappStaking/StakeSideSheet'
import LidoStakeSideSheet from '../components/widgets/staking/lido/StakeSideSheet'
import SlpxStakeSideSheet from '../components/widgets/staking/slpx/StakeSideSheet'
import NominationPoolsStakeSideSheet from '../components/widgets/staking/substrate/NominationPoolsStakeSideSheet'
import { lookupAccountAddressState, selectedAccountsState } from '../domains/accounts'
import { currencyConfig, selectedCurrencyState } from '../domains/balances'
import { useHasActiveWalletConnection } from '../domains/extension'
import { isNilOrWhitespace } from '../util/nil'
import { useTheme } from '@emotion/react'
import {
  Button,
  IconButton,
  NavigationBar,
  NavigationDrawer,
  NavigationRail,
  SCAFFOLD_WIDE_VIEW_MEDIA_SELECTOR,
  Scaffold,
  SearchBar,
  Select,
  SurfaceIconButton,
  Text,
  TopAppBar,
  createPortal,
} from '@talismn/ui'
import {
  Compass,
  CreditCard,
  FileText,
  MoreHorizontal,
  PieChart,
  Repeat,
  Search,
  Star,
  TalismanHand,
  Zap,
} from '@talismn/web-icons'
import { LayoutGroup, motion } from 'framer-motion'
import { usePostHog } from 'posthog-js/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'

const CurrencySelect = () => {
  const [currency, setCurrency] = useRecoilState(selectedCurrencyState)
  return (
    <Select value={currency} onChangeValue={setCurrency} detached>
      {Object.entries(currencyConfig).map(([currency, config]) => (
        <Select.Option
          key={currency}
          value={currency}
          leadingIcon={config.unicodeCharacter}
          headlineContent={config.name}
        />
      ))}
    </Select>
  )
}

const WalletConnectionButton = () => {
  const theme = useTheme()
  const setOpen = useSetRecoilState(walletConnectionSideSheetOpenState)

  const hasActiveConnection = useHasActiveWalletConnection()

  const connectionColor = hasActiveConnection ? '#38D448' : theme.color.onSurface

  return (
    <Button
      variant="surface"
      leadingIcon={
        <div
          css={{
            position: 'relative',
            width: '1.4rem',
            height: '1.4rem',
            border: `0.2rem solid color-mix(in srgb, ${connectionColor}, transparent 70%)`,
            borderRadius: '0.7rem',
          }}
        >
          <div css={{ position: 'absolute', inset: '0.2rem', borderRadius: '50%', backgroundColor: connectionColor }} />
        </div>
      }
      onClick={() => setOpen(true)}
    >
      {hasActiveConnection ? 'Connected' : 'Connect wallet'}
    </Button>
  )
}

const MotionSearch = motion(Search)

const AddressSearch = () => {
  const searchBarRef = useRef<HTMLInputElement>(null)
  const [address, setAddress] = useRecoilState(lookupAccountAddressState)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!isNilOrWhitespace(address)) {
      setRevealed(true)
    }
  }, [address])

  useEffect(() => {
    if (
      searchBarRef.current !== null &&
      searchBarRef.current !== document.activeElement &&
      isNilOrWhitespace(address)
    ) {
      setRevealed(false)
    }
  }, [address])

  return (
    <LayoutGroup>
      {revealed ? (
        <motion.div layoutId="address-search">
          <SearchBar
            autoFocus
            ref={searchBarRef}
            placeholder="Search any account address"
            value={address ?? ''}
            onChange={event => setAddress(event.target.value)}
            onBlur={() => {
              if (isNilOrWhitespace(address)) {
                setRevealed(false)
              }
            }}
          />
        </motion.div>
      ) : (
        <motion.div layoutId="address-search">
          <SurfaceIconButton onClick={() => setRevealed(true)}>
            <MotionSearch layout />
          </SurfaceIconButton>
        </motion.div>
      )}
    </LayoutGroup>
  )
}

const [TitlePortalProvider, TitlePortal, TitlePortalElement] = createPortal()
export { TitlePortal }

const [HeaderWidgetPortalProvider, HeaderWidgetPortal, HeaderWidgetPortalElement] = createPortal()
export { HeaderWidgetPortal }

const Header = () => {
  const shouldShowAccountConnectionGuard = useShouldShowAccountConnectionGuard()
  const accounts = useRecoilValue(selectedAccountsState)

  if (shouldShowAccountConnectionGuard) {
    return null
  }

  return (
    <div css={{ marginBottom: '0.8rem' }}>
      <div
        css={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap-reverse',
          gap: '0.8rem',
          marginTop: '2.4rem',
          marginBottom: '0.8rem',
        }}
      >
        <Text.H2 css={{ marginBottom: 0 }}>
          <TitlePortalElement />
        </Text.H2>
        <div css={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', flexWrap: 'wrap' }}>
          <AddressSearch />
          <CurrencySelect />
          <div css={{ display: 'none', [SCAFFOLD_WIDE_VIEW_MEDIA_SELECTOR]: { display: 'contents' } }}>
            <WalletConnectionButton />
          </div>
        </div>
      </div>
      <div css={{ display: 'flex', gap: '2.4rem', flexWrap: 'wrap' }}>
        <AccountsManagementMenu
          button={<AccountValueInfo account={accounts.length === 1 ? accounts[0] : undefined} balance={<Total />} />}
        />
        <HeaderWidgetPortalElement />
      </div>
    </div>
  )
}

const Layout = () => {
  const posthog = usePostHog()
  const location = useLocation()

  useEffect(() => {
    if (location.hash !== '') {
      const observer = new MutationObserver(() => {
        const element = document.getElementById(location.hash.slice(1))

        if (element !== null) {
          element.scrollIntoView({ behavior: 'smooth' })
          observer.disconnect()
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })

      return observer.disconnect.bind(observer)
    }

    return undefined
  }, [location])

  useEffect(() => {
    posthog?.capture('$pageview')
  }, [location.pathname, posthog])

  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <Scaffold
      breakpoints={{
        topBar: 'narrow',
        bottomBar: 'narrow',
        sideBar: 'wide',
        drawer: 'narrow',
        footer: 'wide',
      }}
      topBar={
        <TopAppBar
          navigationIcon={
            <IconButton as={Link} to="/">
              <TalismanHand />
            </IconButton>
          }
          title={<WalletConnectionButton />}
          actions={
            <TopAppBar.Actions>
              <IconButton onClick={useCallback(() => setDrawerOpen(true), [])}>
                <MoreHorizontal />
              </IconButton>
            </TopAppBar.Actions>
          }
        />
      }
      bottomBar={
        <NavigationBar>
          <Link to="/portfolio">
            <NavigationBar.Item label="Portfolio" icon={<PieChart />} />
          </Link>
          <Link to="/staking">
            <NavigationBar.Item label="Staking" icon={<Zap />} />
          </Link>
          <Link to="/transfer">
            <NavigationBar.Item label="Transport" icon={<Repeat />} />
          </Link>
          <Link to="/crowdloans/participated">
            <NavigationBar.Item label="Crowdloans" icon={<Star />} />
          </Link>
          <Link to="/history">
            <NavigationBar.Item label="History" icon={<FileText />} />
          </Link>
        </NavigationBar>
      }
      sideBar={
        <NavigationRail
          header={
            <IconButton as={Link} to="/" size="4rem">
              <TalismanHand size="4rem" />
            </IconButton>
          }
        >
          <Link to="/portfolio">
            <NavigationRail.Item label="Portfolio" icon={<PieChart />} />
          </Link>
          <Link to="/staking">
            <NavigationRail.Item label="Staking" icon={<Zap />} />
          </Link>
          <Link to="/transfer">
            <NavigationRail.Item label="Transport" icon={<Repeat />} />
          </Link>
          <Link to="/explore">
            <NavigationRail.Item label="Explore" icon={<Compass />} />
          </Link>
          <Link to="/crowdloans/participated">
            <NavigationRail.Item label="Crowdloans" icon={<Star />} />
          </Link>
          <Link to="https://checkout.banxa.com/" target="_blank">
            <NavigationRail.Item label="Buy" icon={<CreditCard />} />
          </Link>
          <Link to="/history">
            <NavigationRail.Item label="History" icon={<FileText />} />
          </Link>
        </NavigationRail>
      }
      drawer={
        <NavigationDrawer
          open={drawerOpen}
          onRequestDismiss={useCallback(() => setDrawerOpen(false), [])}
          headerIcon={<TalismanHand />}
          footer={
            <NavigationDrawer.Footer>
              <Link to="https://discord.gg/talisman" target="_blank">
                <NavigationDrawer.Footer.Icon>
                  <Discord width="2.4rem" height="2.4rem" />
                </NavigationDrawer.Footer.Icon>
              </Link>
              <Link to="https://github.com/TalismanSociety/talisman-web" target="_blank">
                <NavigationDrawer.Footer.Icon>
                  <GitHub width="2.4rem" height="2.4rem" />
                </NavigationDrawer.Footer.Icon>
              </Link>
              <Link to="https://twitter.com/wearetalisman" target="_blank">
                <NavigationDrawer.Footer.Icon>
                  <Twitter width="2.4rem" height="2.4rem" />
                </NavigationDrawer.Footer.Icon>
              </Link>
              <Link to="https://medium.com/we-are-talisman" target="_blank">
                <NavigationDrawer.Footer.Icon>
                  <Medium width="2.4rem" height="2.4rem" />
                </NavigationDrawer.Footer.Icon>
              </Link>
              <NavigationDrawer.Footer.A
                href="https://docs.talisman.xyz/talisman/legal-and-security/terms-of-use"
                target="_blank"
              >
                Terms
              </NavigationDrawer.Footer.A>
              <NavigationDrawer.Footer.A
                href="https://docs.talisman.xyz/talisman/legal-and-security/privacy-policy"
                target="_blank"
              >
                Privacy
              </NavigationDrawer.Footer.A>
            </NavigationDrawer.Footer>
          }
        >
          <Link to="/portfolio">
            <NavigationDrawer.Item label="Portfolio" icon={<PieChart />} />
          </Link>
          <Link to="/staking">
            <NavigationDrawer.Item label="Staking" icon={<Zap />} />
          </Link>
          <Link to="/transfer">
            <NavigationDrawer.Item label="Transport" icon={<Repeat />} />
          </Link>
          <Link to="/crowdloans/participated">
            <NavigationDrawer.Item label="Crowdloans" icon={<Star />} />
          </Link>
          <Link to="/explore">
            <NavigationDrawer.Item label="Explore" icon={<Compass />} />
          </Link>
          <Link to="https://checkout.banxa.com/" target="_blank">
            <NavigationDrawer.Item label="Buy crypto" icon={<CreditCard />} />
          </Link>
          <Link to="/history" target="_blank">
            <NavigationDrawer.Item label="History" icon={<FileText />} />
          </Link>
        </NavigationDrawer>
      }
      footer={
        <div
          css={theme => ({
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            gap: '3.2rem',
            padding: '2.4rem 2.4rem 2.4rem 0',
            a: { opacity: theme.contentAlpha.medium, ':hover': { opacity: theme.contentAlpha.high } },
          })}
        >
          <Text.BodyLarge alpha="high" as="a" href="https://twitter.com/wearetalisman" target="_blank">
            Twitter
          </Text.BodyLarge>
          <Text.BodyLarge alpha="high" as="a" href="https://discord.gg/talisman" target="_blank">
            Discord
          </Text.BodyLarge>
          <Text.BodyLarge alpha="high" as="a" href="https://docs.talisman.xyz" target="_blank">
            Docs
          </Text.BodyLarge>
          <Text.BodyLarge
            alpha="high"
            as="a"
            href="https://docs.talisman.xyz/talisman/legal-and-security/terms-of-use"
            target="_blank"
          >
            Terms
          </Text.BodyLarge>
          <Text.BodyLarge
            alpha="high"
            as="a"
            href="https://docs.talisman.xyz/talisman/legal-and-security/privacy-policy"
            target="_blank"
          >
            Privacy
          </Text.BodyLarge>
        </div>
      }
    >
      {/* TODO: remove legacy imperative modals */}
      <ModalProvider>
        <TitlePortalProvider>
          <HeaderWidgetPortalProvider>
            <Header />
            <Outlet />
            <NominationPoolsStakeSideSheet />
            <DappStakingStakeSideSheet />
            <SlpxStakeSideSheet />
            <LidoStakeSideSheet />
            <WalletConnectionSideSheet />
          </HeaderWidgetPortalProvider>
        </TitlePortalProvider>
      </ModalProvider>
    </Scaffold>
  )
}

export default Layout
