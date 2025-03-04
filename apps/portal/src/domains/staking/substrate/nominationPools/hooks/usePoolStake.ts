import { type StakeStatus } from '../../../../../components/recipes/StakeStatusIndicator'
import { type Account } from '../../../../accounts/recoils'
import { useSubstrateApiState } from '../../../../common'
import { useAllPendingRewardsState, useEraStakersState } from '../recoils'
import { createAccounts, getPoolUnbonding } from '../utils'
import { useDeriveState, useQueryState } from '@talismn/react-polkadot-api'
import { useMemo } from 'react'
import { useRecoilValue, useRecoilValueLoadable, waitForAll } from 'recoil'

export const usePoolStakes = <T extends Account | Account[]>(account: T) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const accounts = useMemo(() => (Array.isArray(account) ? (account as Account[]) : [account as Account]), [account])

  // TODO: recoil freeze if we use `useRecoilValue_TRANSITION_SUPPORT_UNSTABLE` here
  // and perform a stake operation inside the staking dialog & wait for the transition to finish
  // try again with next recoil version or when recoil transition hook is stable
  const pendingRewardsLoadable = useRecoilValueLoadable(useAllPendingRewardsState())
  const pendingRewards = useMemo(() => pendingRewardsLoadable.valueMaybe() ?? [], [pendingRewardsLoadable])

  const [api, _poolMembers] = useRecoilValue(
    waitForAll([
      useSubstrateApiState(),
      useQueryState(
        'nominationPools',
        'poolMembers.multi',
        accounts.map(({ address }) => address)
      ),
    ])
  )
  const accountPools = useMemo(
    () =>
      _poolMembers
        .map((x, index) => ({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          account: accounts[index]!,
          poolMembers: x,
          pendingRewards: pendingRewards.find(rewards => rewards[0] === accounts[index]?.address)?.[1],
        }))
        .filter(x => x.poolMembers.isSome)
        .map(x => ({ ...x, poolMember: x.poolMembers.unwrap() })),
    [_poolMembers, accounts, pendingRewards]
  )

  const stashIds = useMemo(
    () => accountPools.map(x => createAccounts(api, x.poolMember.poolId).stashId),
    [api, accountPools]
  )

  const [poolNominators, slashingSpans, poolMetadatum, claimPermissions, activeEra, sessionProgress] = useRecoilValue(
    waitForAll([
      useQueryState('staking', 'nominators.multi', stashIds),
      useQueryState('staking', 'slashingSpans.multi', stashIds),
      useQueryState(
        'nominationPools',
        'metadata.multi',
        useMemo(() => accountPools.map(x => x.poolMember.poolId), [accountPools])
      ),
      useQueryState(
        'nominationPools',
        'claimPermissions.multi',
        useMemo(() => accountPools.map(x => x.account.address), [accountPools])
      ),
      useQueryState('staking', 'activeEra', []),
      useDeriveState('session', 'progress', []),
    ])
  )

  const _eraStakers = useRecoilValue(useEraStakersState(activeEra.unwrapOrDefault().index))
  const eraStakers = useMemo(() => new Set(_eraStakers.map(x => x.toString())), [_eraStakers])

  const pools = useMemo(
    () =>
      accountPools
        // Calculate unbondings
        .map(({ account, poolMember, pendingRewards }) => ({
          account,
          poolMember,
          pendingRewards,
          ...getPoolUnbonding(poolMember, sessionProgress),
        }))
        // Calculate remaining values
        .map(({ poolMember, ...rest }, index) => {
          const status: StakeStatus = (() => {
            if (poolMember.points.isZero()) {
              return 'not_earning_rewards'
            }

            const targets = poolNominators[index]?.unwrapOrDefault().targets

            if (targets?.length === 0) return 'not_nominating'

            return targets?.some(x => eraStakers.has(x.toHuman())) ? 'earning_rewards' : 'waiting'
          })()

          const priorLength = slashingSpans[index]?.unwrapOr(undefined)?.prior.length
          const slashingSpan = priorLength === undefined ? 0 : priorLength + 1

          return {
            ...rest,
            status,
            poolName: poolMetadatum[index]?.toUtf8(),
            poolMember,
            totalUnlocking: rest.unlockings.reduce((previous, current) => previous + current.amount, 0n),
            slashingSpan,
            claimPermission: claimPermissions[index],
          }
        }),
    [accountPools, claimPermissions, eraStakers, poolMetadatum, poolNominators, sessionProgress, slashingSpans]
  )

  type Result = typeof pools

  type Return = T extends Account[] ? Result : Result[number] | undefined

  return useMemo(() => (Array.isArray(account) ? pools : pools.at(0)) as Return, [account, pools])
}

export type DerivedPool = NonNullable<ReturnType<typeof usePoolStakes<Account>>>
